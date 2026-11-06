import type { AgentToolCall, AgentToolResult } from "@app/ai-api";
import type { AgentConversation, VaultMutationBackend } from "@app/ai-agent";
import type { WebSearchBackend } from "./desktopAgentBridge";
import { detectCliAgents } from "./cliAgentBridge";
import { CLI_AGENT_CATALOG, type CliAgentId } from "./cliAgentTypes";
import type { CliRunCallbacks } from "./useCliAgentExecution";
import type { ChatMessageItem } from "./agentTypes";
import {
  autoSavePromptMemory,
  loadMemoryContext,
} from "./agentMemoryPersistence";
import { resolveProjectSisterConversationsContext } from "./agentProjectContextResolver";
import { applyAndSyncCliVaultActions } from "./agentCliVaultSync";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

export interface ExecuteCliParams {
  agentId: CliAgentId;
  promptText: string;
  vaultPath: string;
  vaultName?: string;
  allNotePaths?: string[];
  webSearchEnabled?: boolean;
  webSearchBackend: WebSearchBackend;
  appendLog: (entry: string) => void;
  appendChunk: (chunk: string) => void;
  runCliPrompt: (
    agentId: CliAgentId,
    agentName: string,
    promptText: string,
    vaultPath: string,
    callbacks?: CliRunCallbacks,
  ) => Promise<void>;
  onComplete: (
    finalOutput: string,
    toolCalls?: AgentToolCall[],
    toolResults?: AgentToolResult[],
  ) => void;
  nextMessages?: ChatMessageItem[];
  projectId?: string;
  projectSources?: string[];
  projectInstructions?: string;
  projectName?: string;
  conversations?: AgentConversation[];
  activeConversationId?: string;
  mutationBackend?: VaultMutationBackend;
}

export async function executeCliAgentSession(
  params: ExecuteCliParams,
): Promise<void> {
  const {
    agentId,
    promptText,
    vaultPath,
    vaultName,
    allNotePaths,
    webSearchEnabled,
    webSearchBackend,
    appendLog,
    appendChunk,
    runCliPrompt,
    onComplete,
    nextMessages = [],
    projectId,
    projectSources = [],
    projectInstructions,
    projectName,
    conversations,
    activeConversationId,
    mutationBackend,
  } = params;

  const meta = CLI_AGENT_CATALOG[agentId];
  const name = meta?.name || agentId;

  appendLog(`Checking availability for ${name}...`);
  const detected = await detectCliAgents();
  const info = detected.find((a) => a.id === agentId);

  if (!info || !info.installed) {
    const cmd = meta?.installCommand || `npm install -g ${agentId}`;
    throw new Error(
      `${name} is not installed or not found in PATH.\n\n` +
        `Install command:\n${cmd}\n\n` +
        `Once installed, retry your message or switch to Sophia Assistant in the model picker.`,
    );
  }

  // 1. Auto-save explicit "remember that" instructions (idempotent via dedup in memory module)
  await autoSavePromptMemory(promptText, mutationBackend, projectId, appendLog);

  // 2. Load Long-term Memory
  const memoryContext = await loadMemoryContext(mutationBackend, projectId);

  // 3. Optional Web Search
  let webSearchContext = "";
  if (webSearchEnabled) {
    appendLog("Performing web search for live context...");
    try {
      const results = await webSearchBackend.search(promptText, 5);
      if (results.length > 0) {
        appendLog(`Retrieved ${results.length} web sources.`);
        webSearchContext = results
          .map(
            (r, i) => `${i + 1}. ${r.title}\nURL: ${r.url}\n${r.snippet}`,
          )
          .join("\n\n");
      } else {
        appendLog("No web results found.");
      }
    } catch (err) {
      appendLog(
        `Web search warning: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // 4. Conversation History (Previous turns before current prompt)
  const historyTurns = nextMessages
    .slice(0, -1)
    .filter((m) => m.content && m.content.trim())
    .slice(-10)
    .map(
      (m) =>
        `${m.role === "user" ? "User" : "Assistant"}: ${m.content.trim()}`,
    )
    .join("\n\n");

  // 5. Shared Context from Sister Conversations in this Project
  const sisterContext = resolveProjectSisterConversationsContext({
    projectId,
    currentConversationId: activeConversationId,
    conversations,
    projectName,
  });

  // 6. Construct comprehensive prompt with active vault workspace, history, memory and request
  const promptSections: string[] = [];

  const vName =
    projectName ||
    vaultName ||
    (vaultPath ? vaultPath.split(/[/\\]/).pop() || "Vault" : "Vault");
  const noteList =
    allNotePaths && allNotePaths.length > 0
      ? `Available notes in vault (${allNotePaths.length} notes):\n${allNotePaths
          .slice(0, 60)
          .map((n) => `- ${n}`)
          .join("\n")}${allNotePaths.length > 60 ? `\n...and ${allNotePaths.length - 60} more notes` : ""}`
      : "The vault currently contains no notes.";

  promptSections.push(
    `[Active Vault Workspace]\n` +
      `Vault Name: ${vName}\n` +
      `Vault Directory Path: ${vaultPath}\n` +
      `You are executing directly inside the user's active local vault directory (${vaultPath}).\n` +
      `${noteList}\n\n` +
      `VAULT INSTRUCTIONS:\n` +
      `- You ALWAYS point to this opened vault workspace. Every file operation targets this vault.\n` +
      `- You have full permission to inspect, read, search, create, and edit notes in this vault directory.\n` +
      `- When answering questions about user notes, characters, stories, ideas, or projects, read the vault files directly.\n` +
      `- When asked to add, create, or update files, folders, or notes, DO NOT merely describe what you would write. You MUST write or edit the actual files in this vault directory immediately so they appear in the vault.\n` +
      `- To guarantee your vault operations are applied and linked in the UI, also emit <vault_action> tags for any folder or note you create/edit/move:\n` +
      `  <vault_action type="create_folder" path="FolderName" />\n` +
      `  <vault_action type="create_note" path="FolderName/Note.md">Markdown content here</vault_action>\n` +
      `  <vault_action type="edit_note" path="FolderName/Note.md">Updated markdown content</vault_action>\n` +
      `  <vault_action type="move_note" from="Old.md" to="FolderName/Old.md" />`,
  );

  if (memoryContext.trim()) {
    promptSections.push(
      `[Long-Term Memory & Saved Context]\n${memoryContext.trim()}`,
    );
  }

  if (projectName || projectInstructions?.trim()) {
    const projHeader = projectName ? ` (${projectName})` : "";
    const instr = projectInstructions?.trim() || "";
    if (instr) {
      promptSections.push(`[Project Instructions${projHeader}]\n${instr}`);
    }
  }

  if (sisterContext.trim()) {
    promptSections.push(sisterContext.trim());
  }

  if (projectSources.length > 0 && mutationBackend) {
    const sourceTexts: string[] = [];
    for (const src of projectSources.slice(0, 5)) {
      try {
        const raw = await mutationBackend.readNote(src);
        if (raw) sourceTexts.push(`### File: ${src}\n${raw.slice(0, 1500)}`);
      } catch {
        // ignore unreadable sources
      }
    }
    if (sourceTexts.length > 0) {
      promptSections.push(`[Project Sources]\n${sourceTexts.join("\n\n")}`);
    }
  }

  if (webSearchContext.trim()) {
    promptSections.push(`[Web Search Results]\n${webSearchContext.trim()}`);
  }

  if (historyTurns.trim()) {
    promptSections.push(`[Conversation History]\n${historyTurns.trim()}`);
  }

  promptSections.push(`[Current User Request]\n${promptText}`);

  const finalPrompt = promptSections.join("\n\n");

  appendLog(`Launching ${name} with conversation context...`);

  const beforeState = useWorkspaceStore.getState();
  const beforeNotes = [...(allNotePaths ?? beforeState.allNotePaths ?? [])];
  const beforeFolders = [...(beforeState.allFolderPaths ?? [])];

  await runCliPrompt(agentId, name, finalPrompt, vaultPath, {
    onLog: (line) => {
      appendLog(line);
    },
    onChunk: (chunk) => {
      appendChunk(chunk);
    },
    onComplete: (output) => {
      void applyAndSyncCliVaultActions({
        output,
        promptText,
        beforeNotes,
        beforeFolders,
        mutationBackend,
        appendLog,
      }).then(({ cleanedOutput, toolCalls, toolResults }) => {
        onComplete(
          cleanedOutput,
          toolCalls.length > 0 ? toolCalls : undefined,
          toolResults.length > 0 ? toolResults : undefined,
        );
      });
    },
  });
}
