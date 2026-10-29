export type ScheduleRecurrence =
  | { type: "daily"; timeUtc: string } // "HH:mm" in UTC
  | { type: "weekly"; dayOfWeek: number; timeUtc: string } // 0=Sunday..6=Saturday
  | { type: "interval"; intervalHours: number };

export interface AgentSchedule {
  id: string;
  title: string;
  prompt: string;
  recurrence: ScheduleRecurrence;
  enabled: boolean;
  lastRunUtc?: string;
  nextRunUtc: string;
  requireApproval?: boolean;
}

export interface AgentScheduleRunRecord {
  id: string;
  scheduleId: string;
  scheduleTitle: string;
  runAtUtc: string;
  status: "success" | "failed" | "pending_review";
  summary?: string;
  error?: string;
}

/**
 * Computes the next occurrence for a given recurrence definition.
 */
export function computeNextRun(recurrence: ScheduleRecurrence, fromDate: Date = new Date()): Date {
  const fromMs = fromDate.getTime();

  if (recurrence.type === "interval") {
    const hoursMs = Math.max(1, recurrence.intervalHours) * 3600 * 1000;
    return new Date(fromMs + hoursMs);
  }

  const [targetH, targetM] = recurrence.timeUtc.split(":").map((v) => parseInt(v, 10) || 0);

  if (recurrence.type === "daily") {
    const candidate = new Date(fromDate);
    candidate.setUTCHours(targetH, targetM, 0, 0);
    if (candidate.getTime() <= fromMs) {
      candidate.setUTCDate(candidate.getUTCDate() + 1);
    }
    return candidate;
  }

  if (recurrence.type === "weekly") {
    const candidate = new Date(fromDate);
    candidate.setUTCHours(targetH, targetM, 0, 0);
    const currentDay = candidate.getUTCDay();
    const targetDay = recurrence.dayOfWeek;
    let daysToAdd = (targetDay - currentDay + 7) % 7;

    if (daysToAdd === 0 && candidate.getTime() <= fromMs) {
      daysToAdd = 7;
    }
    candidate.setUTCDate(candidate.getUTCDate() + daysToAdd);
    return candidate;
  }

  return new Date(fromMs + 24 * 3600 * 1000);
}

/**
 * Checks whether a schedule is currently due.
 */
export function isScheduleDue(schedule: AgentSchedule, now: Date = new Date()): boolean {
  if (!schedule.enabled) return false;
  const nextRunMs = new Date(schedule.nextRunUtc).getTime();
  if (isNaN(nextRunMs)) return false;
  return now.getTime() >= nextRunMs;
}

/**
 * Evaluates active schedules, differentiating immediate due tasks from tasks
 * missed while the application was closed (> 1 hour overdue).
 */
export function evaluatePendingSchedules(
  schedules: AgentSchedule[],
  now: Date = new Date(),
  missedThresholdMs = 3600 * 1000,
): { dueImmediately: AgentSchedule[]; missedWhileClosed: AgentSchedule[] } {
  const dueImmediately: AgentSchedule[] = [];
  const missedWhileClosed: AgentSchedule[] = [];
  const nowMs = now.getTime();

  for (const s of schedules) {
    if (!s.enabled) continue;
    const nextRunMs = new Date(s.nextRunUtc).getTime();
    if (isNaN(nextRunMs)) continue;

    if (nowMs >= nextRunMs) {
      if (nowMs - nextRunMs > missedThresholdMs) {
        missedWhileClosed.push(s);
      } else {
        dueImmediately.push(s);
      }
    }
  }

  return { dueImmediately, missedWhileClosed };
}

/**
 * Updates schedule timestamps after a run.
 */
export function advanceScheduleAfterRun(
  schedule: AgentSchedule,
  runTime: Date = new Date(),
): AgentSchedule {
  const nextRun = computeNextRun(schedule.recurrence, runTime);
  return {
    ...schedule,
    lastRunUtc: runTime.toISOString(),
    nextRunUtc: nextRun.toISOString(),
  };
}

/**
 * Parse schedules JSON file safely.
 */
export function parseSchedulesFile(content: string | null): AgentSchedule[] {
  if (!content?.trim()) return [];
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Records a schedule run into execution history, maintaining bounded history (50 records).
 */
export function appendScheduleRunRecord(
  history: AgentScheduleRunRecord[],
  record: AgentScheduleRunRecord,
  maxHistory = 50,
): AgentScheduleRunRecord[] {
  const updated = [record, ...history];
  return updated.slice(0, maxHistory);
}
