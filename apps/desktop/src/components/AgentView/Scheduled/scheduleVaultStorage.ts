import { parseSchedulesFile, type AgentSchedule } from "@app/ai-agent";
import { readNote, writeNote } from "../../../vault/vaultCommands";

/** Same location the legacy `useAgentSchedules` hook reads from. */
export const SCHEDULES_PATH = ".davinci/agent/schedules.json";

export async function loadSchedulesFromVault(): Promise<AgentSchedule[]> {
  try {
    const file = await readNote(SCHEDULES_PATH);
    return parseSchedulesFile(file.content);
  } catch {
    // Missing file on first use is expected.
    return [];
  }
}

export async function saveSchedulesToVault(
  schedules: AgentSchedule[],
): Promise<void> {
  try {
    await writeNote(SCHEDULES_PATH, JSON.stringify(schedules, null, 2));
  } catch (err) {
    console.warn("[scheduleVaultStorage] Failed to save schedules:", err);
  }
}
