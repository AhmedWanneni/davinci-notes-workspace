import type { NormalizedCalendarEvent } from "@app/google-calendar-api";

export interface UpcomingMeetingAlert {
  event: NormalizedCalendarEvent;
  stage: "5min" | "now";
  startsInMinutes: number;
}

export interface TrayMeetingItem {
  notePath: string;
  line: number;
  text: string;
  dueTime: string;
}

/**
 * Checks for upcoming meetings that require a 5-minute heads-up or start notification.
 */
export function getUpcomingMeetingAlerts(
  events: NormalizedCalendarEvent[],
  now: Date = new Date(),
  notifiedKeys: Set<string> = new Set(),
): UpcomingMeetingAlert[] {
  const alerts: UpcomingMeetingAlert[] = [];
  const nowMs = now.getTime();

  for (const event of events) {
    if (event.status === "cancelled") continue;

    const startMs = new Date(event.startIso).getTime();
    if (isNaN(startMs)) continue;

    const diffMs = startMs - nowMs;
    const diffMinutes = Math.round(diffMs / 60000);

    // 5-minute heads-up (between 1 and 6 minutes before start)
    const key5min = `${event.id}-5min`;
    if (diffMs > 0 && diffMs <= 6 * 60 * 1000 && !notifiedKeys.has(key5min)) {
      alerts.push({
        event,
        stage: "5min",
        startsInMinutes: Math.max(1, diffMinutes),
      });
      notifiedKeys.add(key5min);
      continue;
    }

    // Starting now / in progress (within last 2 minutes to start)
    const keyNow = `${event.id}-now`;
    if (diffMs <= 0 && diffMs >= -2 * 60 * 1000 && !notifiedKeys.has(keyNow)) {
      alerts.push({
        event,
        stage: "now",
        startsInMinutes: 0,
      });
      notifiedKeys.add(keyNow);
    }
  }

  return alerts;
}

/**
 * Formats today's upcoming meetings as tray reminder items.
 */
export function formatUpcomingMeetingsForTray(
  events: NormalizedCalendarEvent[],
  now: Date = new Date(),
): TrayMeetingItem[] {
  const nowMs = now.getTime();
  const futureCutoff = nowMs + 12 * 60 * 60 * 1000;

  return events
    .filter((event) => {
      if (event.status === "cancelled") return false;
      const startMs = new Date(event.startIso).getTime();
      return startMs >= nowMs - 5 * 60 * 1000 && startMs <= futureCutoff;
    })
    .sort(
      (a, b) =>
        new Date(a.startIso).getTime() - new Date(b.startIso).getTime(),
    )
    .slice(0, 3)
    .map((event) => {
      const startDate = new Date(event.startIso);
      const hours = String(startDate.getHours()).padStart(2, "0");
      const minutes = String(startDate.getMinutes()).padStart(2, "0");
      const prefix = event.meetUrl ? "📹 " : "📅 ";
      return {
        notePath: event.meetUrl ?? "",
        line: 0,
        text: `${prefix}${event.title}`,
        dueTime: `${hours}:${minutes}`,
      };
    });
}

/**
 * Runs a periodic scheduler that checks events and invokes onAlert.
 */
export function startMeetingReminderScheduler(
  getEvents: () => Promise<NormalizedCalendarEvent[]>,
  onAlert: (alert: UpcomingMeetingAlert) => void,
  intervalMs: number = 30000,
): () => void {
  const notifiedKeys = new Set<string>();
  let active = true;

  const check = async () => {
    if (!active) return;
    try {
      const events = await getEvents();
      if (!active) return;
      const alerts = getUpcomingMeetingAlerts(events, new Date(), notifiedKeys);
      for (const alert of alerts) {
        onAlert(alert);
      }
    } catch (e) {
      console.warn("[calendar-reminders] Check failed:", e);
    }
  };

  void check();
  const timer = setInterval(() => void check(), intervalMs);

  return () => {
    active = false;
    clearInterval(timer);
    notifiedKeys.clear();
  };
}
