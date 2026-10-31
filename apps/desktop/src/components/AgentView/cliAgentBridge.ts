import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { CliAgentInfo, CliAgentStreamEvent } from "./cliAgentTypes";

export async function detectCliAgents(): Promise<CliAgentInfo[]> {
  try {
    return await invoke<CliAgentInfo[]>("cli_agent_detect");
  } catch (err) {
    console.warn("[cli-agent] Failed to detect CLI agents:", err);
    return [];
  }
}

export async function startCliAgentSession(
  sessionId: string,
  agentId: string,
  prompt: string,
  vaultPath: string,
): Promise<void> {
  await invoke("cli_agent_start", {
    sessionId,
    agentId,
    prompt,
    vaultPath,
  });
}

export async function cancelCliAgentSession(sessionId: string): Promise<void> {
  try {
    await invoke("cli_agent_cancel", { sessionId });
  } catch (err) {
    console.warn("[cli-agent] Failed to cancel session:", err);
  }
}

export function subscribeCliAgentStream(
  sessionId: string,
  onEvent: (event: CliAgentStreamEvent) => void,
): Promise<UnlistenFn> {
  return listen<CliAgentStreamEvent>("cli-agent-stream", (event) => {
    if (event.payload.session_id === sessionId) {
      onEvent(event.payload);
    }
  });
}
