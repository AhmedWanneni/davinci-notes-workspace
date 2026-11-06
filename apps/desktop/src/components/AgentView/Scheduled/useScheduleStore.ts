import { create } from "zustand";
import {
  advanceScheduleAfterRun,
  computeNextRun,
  type AgentSchedule,
} from "@app/ai-agent";
import { toUtcRecurrence } from "./scheduleTime";
import type { ScheduleDraft } from "./parseScheduleIntent";
import {
  loadSchedulesFromVault,
  saveSchedulesToVault,
} from "./scheduleVaultStorage";

export type ScheduledTask = AgentSchedule & { emoji?: string };

export interface ScheduleStoreState {
  schedules: ScheduledTask[];
  isLoaded: boolean;
  /** Id of the most recently created task, used for the "Created" notice. */
  lastCreatedId: string | null;
  load: () => Promise<void>;
  addSchedule: (draft: ScheduleDraft) => Promise<AgentSchedule>;
  updateSchedule: (id: string, draft: ScheduleDraft) => Promise<void>;
  toggleSchedule: (id: string) => Promise<void>;
  removeSchedule: (id: string) => Promise<void>;
  markRun: (id: string, at?: Date) => Promise<void>;
  runNow: (id: string) => Promise<void>;
  clearLastCreated: () => void;
}

function buildSchedule(draft: ScheduleDraft, base?: ScheduledTask): ScheduledTask {
  const recurrence = toUtcRecurrence(draft.spec);
  return {
    id: base?.id ?? `sched_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: draft.title.trim() || "Scheduled task",
    prompt: draft.prompt.trim(),
    emoji: draft.emoji ?? base?.emoji,
    recurrence,
    enabled: base?.enabled ?? true,
    lastRunUtc: base?.lastRunUtc,
    nextRunUtc: computeNextRun(recurrence, new Date()).toISOString(),
  };
}

export const useScheduleStore = create<ScheduleStoreState>((set, get) => {
  const commit = async (schedules: AgentSchedule[]) => {
    set({ schedules });
    await saveSchedulesToVault(schedules);
  };

  return {
    schedules: [],
    isLoaded: false,
    lastCreatedId: null,

    load: async () => {
      const schedules = await loadSchedulesFromVault();
      set({ schedules, isLoaded: true });
    },

    addSchedule: async (draft) => {
      const schedule = buildSchedule(draft);
      set({ lastCreatedId: schedule.id });
      await commit([...get().schedules, schedule]);
      return schedule;
    },

    updateSchedule: async (id, draft) => {
      await commit(
        get().schedules.map((s) => (s.id === id ? buildSchedule(draft, s) : s)),
      );
    },

    toggleSchedule: async (id) => {
      await commit(
        get().schedules.map((s) => {
          if (s.id !== id) return s;
          const enabled = !s.enabled;
          // Re-arm from now when resuming so a paused task doesn't fire instantly.
          const nextRunUtc = enabled
            ? computeNextRun(s.recurrence, new Date()).toISOString()
            : s.nextRunUtc;
          return { ...s, enabled, nextRunUtc };
        }),
      );
    },

    removeSchedule: async (id) => {
      await commit(get().schedules.filter((s) => s.id !== id));
    },

    markRun: async (id, at = new Date()) => {
      await commit(
        get().schedules.map((s) =>
          s.id === id ? advanceScheduleAfterRun(s, at) : s,
        ),
      );
    },

    runNow: async (id) => {
      // Making the task due hands it to the runner mounted in AgentView.
      const nowIso = new Date().toISOString();
      await commit(
        get().schedules.map((s) =>
          s.id === id ? { ...s, enabled: true, nextRunUtc: nowIso } : s,
        ),
      );
    },

    clearLastCreated: () => set({ lastCreatedId: null }),
  };
});
