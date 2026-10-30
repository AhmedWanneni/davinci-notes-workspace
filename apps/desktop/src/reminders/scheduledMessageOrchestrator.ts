import type Database from "@tauri-apps/plugin-sql";
import {
  listScheduledMessages,
  markScheduledMessageSent,
  markScheduledMessageFailed,
  markScheduledMessageMissed,
} from "./scheduledMessagesStore";
import { notify } from "../notifications/notifyDispatcher";
import { getIndexDb } from "../vault/remindersViewQueries";
import { advanceRecurringReminder } from "@app/indexer";

const MISSED_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function computeNextDueUtc(dueAtUtc: string, repeatRule: string): string | null {
  const dt = new Date(dueAtUtc);
  if (isNaN(dt.getTime())) return null;

  const dateStr = dt.toISOString().slice(0, 10);
  const timeStr = dt.toISOString().slice(11, 16);
  const advanced = advanceRecurringReminder(dateStr, timeStr, repeatRule);
  if (!advanced) return null;

  return advanced.nextDueAtUtc;
}

export async function processDueScheduledMessages(
  db: Database | null,
  nowMs = Date.now(),
): Promise<void> {
  const messages = await listScheduledMessages(db);
  const active = messages.filter((m) => m.status === "scheduled");

  let changed = false;

  for (const msg of active) {
    const dueMs = new Date(msg.dueAtUtc).getTime();
    if (isNaN(dueMs) || dueMs > nowMs) continue;

    // Check if missed while offline/asleep
    if (nowMs - dueMs > MISSED_THRESHOLD_MS) {
      await markScheduledMessageMissed(msg.id, db);
      changed = true;
      continue;
    }

    // WhatsApp requires manual sending
    if (msg.channelKind === "whatsapp-click") {
      if (db) {
        await db.execute(
          "UPDATE scheduled_messages SET status = 'needs_manual_send' WHERE id = $1",
          [msg.id],
        );
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("davinci:whatsapp-manual-toast", {
            detail: {
              title: `WhatsApp: ${msg.recipientLabel}`,
              text: msg.messageText,
              dueAtUtc: msg.dueAtUtc,
            },
          }),
        );
      }
      changed = true;
      continue;
    }

    // Automatic dispatch for Telegram, Slack, CallMeBot
    const res = await notify(msg.channelKind, {
      title: "Scheduled Message",
      body: msg.messageText,
      recipient: msg.recipientLabel,
      allowChannelMentions: msg.allowMentions,
    });

    if (res.ok || res.success) {
      if (msg.recurrenceRule) {
        const nextUtc = computeNextDueUtc(msg.dueAtUtc, msg.recurrenceRule);
        if (nextUtc && db) {
          await db.execute(
            "UPDATE scheduled_messages SET due_at_utc = $1, status = 'scheduled', last_error = NULL WHERE id = $2",
            [nextUtc, msg.id],
          );
        } else {
          await markScheduledMessageSent(msg.id, db);
        }
      } else {
        await markScheduledMessageSent(msg.id, db);
      }
    } else {
      await markScheduledMessageFailed(msg.id, res.error ?? "Failed to send", db);
    }
    changed = true;
  }

  if (changed && typeof window !== "undefined") {
    window.dispatchEvent(new Event("davinci-scheduled-messages-updated"));
  }
}

export function startScheduledMessageOrchestrator(): () => void {
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const tick = async () => {
    let db: Database | null = null;
    try {
      db = await getIndexDb();
    } catch {
      // outside Tauri or db unavailable
    }
    try {
      await processDueScheduledMessages(db);
    } catch (err) {
      console.warn("Scheduled message tick error:", err);
    }
  };

  void tick();
  intervalId = setInterval(tick, 10_000);

  const handleWake = () => void tick();
  if (typeof window !== "undefined") {
    window.addEventListener("focus", handleWake);
    window.addEventListener("online", handleWake);
    window.addEventListener("davinci-scheduled-messages-updated", handleWake);
  }

  return () => {
    if (intervalId) clearInterval(intervalId);
    if (typeof window !== "undefined") {
      window.removeEventListener("focus", handleWake);
      window.removeEventListener("online", handleWake);
      window.removeEventListener("davinci-scheduled-messages-updated", handleWake);
    }
  };
}
