import { useEffect, useRef, useState } from "react";
import { isScheduleDue, type AgentSchedule } from "@app/ai-agent";
import { useScheduleStore } from "./useScheduleStore";

/** setTimeout max is ~24.8 days; re-arm at most every 6h to absorb clock drift / sleep. */
const MAX_TIMER_MS = 6 * 3600 * 1000;

export interface ScheduleRunnerOptions {
  /** True while the agent is already answering — due tasks wait for it. */
  isBusy: boolean;
  runTask: (schedule: AgentSchedule) => void;
}

/**
 * Fires scheduled prompts at their time. Uses a single timeout aimed at the
 * earliest upcoming run (no polling) plus a focus/visibility re-check so
 * runs missed during system sleep or while the app was closed catch up once.
 */
export function useScheduleRunner({ isBusy, runTask }: ScheduleRunnerOptions) {
  const schedules = useScheduleStore((s) => s.schedules);
  const isLoaded = useScheduleStore((s) => s.isLoaded);
  const [tick, setTick] = useState(0);
  const runTaskRef = useRef(runTask);
  runTaskRef.current = runTask;

  useEffect(() => {
    if (!useScheduleStore.getState().isLoaded) {
      void useScheduleStore.getState().load();
    }
    const recheck = () => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    };
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", recheck);
    return () => {
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || isBusy) return;
    const now = new Date();
    const due = schedules.find((s) => isScheduleDue(s, now));
    if (due) {
      // Advance first so a re-render can never fire the same run twice.
      void useScheduleStore.getState().markRun(due.id, now);
      runTaskRef.current(due);
      return;
    }

    const upcoming = schedules
      .filter((s) => s.enabled)
      .map((s) => new Date(s.nextRunUtc).getTime())
      .filter((ms) => !isNaN(ms));
    if (upcoming.length === 0) return;

    const delay = Math.min(
      MAX_TIMER_MS,
      Math.max(1000, Math.min(...upcoming) - now.getTime()),
    );
    const timer = window.setTimeout(() => setTick((t) => t + 1), delay);
    return () => window.clearTimeout(timer);
  }, [schedules, isLoaded, isBusy, tick]);
}
