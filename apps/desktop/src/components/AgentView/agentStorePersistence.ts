import {
  AGENT_CONVERSATIONS_PATH,
  serializeConversationsData,
  type AgentConversationsData,
} from "@app/ai-agent";
import { writeNote } from "../../vault/vaultCommands";

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export async function persistToVault(
  data: AgentConversationsData,
  immediate = false,
): Promise<void> {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
  }
  const write = async () => {
    try {
      await writeNote(
        AGENT_CONVERSATIONS_PATH,
        serializeConversationsData(data),
      );
    } catch (e) {
      console.warn("[agent] Failed to persist conversations:", e);
    }
  };
  if (immediate) {
    await write();
  } else {
    saveDebounceTimer = setTimeout(() => {
      void write();
    }, 800);
  }
}
