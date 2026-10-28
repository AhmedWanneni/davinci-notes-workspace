import type { DeliveryChannel } from "../notifications/channelTypes";
import { notify } from "../notifications/notifyDispatcher";
import { loadChannelDestinations } from "../notifications/channelConfigStore";
import {
  getIndexDb,
  upsertReminderChannelState,
} from "../vault/remindersViewQueries";
import type Database from "@tauri-apps/plugin-sql";

export interface DueReminderItem {
  reminderKey: string;
  notePath: string;
  dueAtUtc: string;
  text: string;
  line?: number;
}

const recentDispatches = new Map<string, number>();
const DEDUP_WINDOW_MS = 60_000;

export async function dispatchReminderChannels(
  db: Database | null,
  item: DueReminderItem,
): Promise<{ success: boolean; errors: string[] }> {
  const now = Date.now();
  const lastTime = recentDispatches.get(item.reminderKey);
  if (lastTime && now - lastTime < DEDUP_WINDOW_MS) {
    return { success: true, errors: [] };
  }
  recentDispatches.set(item.reminderKey, now);

  // 1. Determine channels (local override in DB vs global defaults)
  let targetChannels: DeliveryChannel[] = ["desktop"];
  if (db) {
    try {
      const rows = await db.select<Array<{ channels_json: string | null }>>(
        "SELECT channels_json FROM reminder_local_state WHERE reminder_key = $1",
        [item.reminderKey],
      );
      if (rows[0]?.channels_json) {
        targetChannels = JSON.parse(rows[0].channels_json) as DeliveryChannel[];
      }
    } catch {
      // fallback to global defaults
    }
  }

  // If no per-reminder channels configured, check enabled channels in config
  if (targetChannels.length === 0 || (targetChannels.length === 1 && targetChannels[0] === "desktop")) {
    try {
      const destinations = await loadChannelDestinations(db ?? undefined);
      const enabled = destinations.filter((c) => c.enabled).map((c) => c.kind);
      if (enabled.length > 0) {
        targetChannels = Array.from(new Set([...targetChannels, ...enabled]));
      }
    } catch {
      // keep desktop
    }
  }

  const errors: string[] = [];

  for (const channel of targetChannels) {
    if (channel === "desktop") continue; // Desktop handled by Tauri native toast
    try {
      const res = await notify(channel, {
        title: "Reminder Due",
        body: item.text,
        notePath: item.notePath,
        line: item.line,
      });
      if (!res.ok && !res.success && res.error) {
        errors.push(`${channel}: ${res.error}`);
      }
    } catch (err) {
      errors.push(`${channel}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2. Persist any delivery failure to reminder_local_state
  if (db) {
    try {
      await upsertReminderChannelState(db, {
        reminderKey: item.reminderKey,
        notePath: item.notePath,
        dueAtUtc: item.dueAtUtc,
        text: item.text,
        deliveryError: errors.length > 0 ? errors.join("; ") : null,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("davinci-reminders-updated"));
      }
    } catch (err) {
      console.warn("Failed to persist reminder delivery error:", err);
    }
  }

  return { success: errors.length === 0, errors };
}

export function startReminderChannelOrchestrator(): () => void {
  let unlistenDue: (() => void) | undefined;

  void (async () => {
    try {
      const { listen } = await import("@tauri-apps/api/event");
      unlistenDue = await listen<Array<Record<string, unknown>>>("davinci-reminders-due", async (event) => {
        if (!Array.isArray(event.payload)) return;
        let db: Database | null = null;
        try {
          db = await getIndexDb();
        } catch {
          // outside Tauri or db unavailable
        }

        for (const raw of event.payload) {
          const item: DueReminderItem = {
            reminderKey: String(raw.reminder_key ?? raw.reminderKey ?? ""),
            notePath: String(raw.note_path ?? raw.notePath ?? ""),
            dueAtUtc: String(raw.due_at_utc ?? raw.dueAtUtc ?? ""),
            text: String(raw.text ?? ""),
            line: typeof raw.line === "number" ? raw.line : undefined,
          };
          if (item.reminderKey && item.text) {
            void dispatchReminderChannels(db, item);
          }
        }
      });
    } catch {
      // outside Tauri runtime
    }
  })();

  return () => {
    unlistenDue?.();
  };
}
