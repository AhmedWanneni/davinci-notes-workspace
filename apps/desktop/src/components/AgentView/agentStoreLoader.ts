import {
  AGENT_CONVERSATIONS_PATH,
  parseConversationsData,
  type AgentProject,
  type LibraryItem,
} from "@app/ai-agent";
import { readNote } from "../../vault/vaultCommands";
import { loadLibraryItemsFromVault, DEFAULT_LIBRARY_ITEMS } from "./Library";

export interface LoadedAgentData {
  conversations: ReturnType<typeof parseConversationsData>["conversations"];
  projects: AgentProject[];
  libraryItems: LibraryItem[];
  projectInstructions: Record<string, string>;
  activeConversationId: string | null;
  isLoaded: true;
}

/** Load conversations, projects and library items from vault storage. */
export async function loadAgentData(): Promise<LoadedAgentData> {
  try {
    const file = await readNote(AGENT_CONVERSATIONS_PATH);
    const parsed = parseConversationsData(file.content);
    const instructionsMap: Record<string, string> = {};
    for (const p of parsed.projects) {
      if (p.instructions) instructionsMap[p.id] = p.instructions;
    }
    let vaultItems: LibraryItem[] = [];
    try {
      vaultItems = await loadLibraryItemsFromVault(parsed.projects);
    } catch (err) {
      console.warn(
        "[agentStore] Failed to load library items from vault:",
        err,
      );
    }

    return {
      conversations: parsed.conversations,
      projects: parsed.projects,
      libraryItems:
        vaultItems.length > 0
          ? vaultItems
          : parsed.libraryItems?.length
            ? parsed.libraryItems
            : DEFAULT_LIBRARY_ITEMS,
      projectInstructions: instructionsMap,
      activeConversationId: parsed.activeConversationId,
      isLoaded: true,
    };
  } catch {
    const empty = parseConversationsData(null);
    let vaultItems: LibraryItem[] = [];
    try {
      vaultItems = await loadLibraryItemsFromVault(empty.projects);
    } catch {
      /* ignored */
    }
    return {
      conversations: empty.conversations,
      projects: empty.projects,
      libraryItems: vaultItems.length > 0 ? vaultItems : DEFAULT_LIBRARY_ITEMS,
      projectInstructions: {},
      activeConversationId: null,
      isLoaded: true,
    };
  }
}
