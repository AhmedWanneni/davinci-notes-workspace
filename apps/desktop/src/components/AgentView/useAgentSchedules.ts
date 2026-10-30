import { useCallback, useEffect, useState } from "react";
import {
  evaluatePendingSchedules,
  parseSchedulesFile,
  type AgentSchedule,
} from "@app/ai-agent";
import { readNote } from "../../vault/vaultCommands";

export interface AgentSchedulesState {
  schedules: AgentSchedule[];
  missedSchedules: AgentSchedule[];
  dueSchedules: AgentSchedule[];
  dismissMissed: () => void;
  reloadSchedules: () => Promise<void>;
}

export function useAgentSchedules(): AgentSchedulesState {
  const [schedules, setSchedules] = useState<AgentSchedule[]>([]);
  const [missedSchedules, setMissedSchedules] = useState<AgentSchedule[]>([]);
  const [dueSchedules, setDueSchedules] = useState<AgentSchedule[]>([]);

  const reloadSchedules = useCallback(async () => {
    try {
      const file = await readNote(".davinci/agent/schedules.json");
      const list = parseSchedulesFile(file.content);
      setSchedules(list);

      const evaluation = evaluatePendingSchedules(list, new Date());
      setMissedSchedules(evaluation.missedWhileClosed);
      setDueSchedules(evaluation.dueImmediately);
    } catch {
      setSchedules([]);
      setMissedSchedules([]);
      setDueSchedules([]);
    }
  }, []);

  const dismissMissed = useCallback(() => {
    setMissedSchedules([]);
  }, []);

  useEffect(() => {
    reloadSchedules();
    const interval = setInterval(reloadSchedules, 60_000);
    return () => clearInterval(interval);
  }, [reloadSchedules]);

  return {
    schedules,
    missedSchedules,
    dueSchedules,
    dismissMissed,
    reloadSchedules,
  };
}
