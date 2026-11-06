import type { AgentToolCall, AgentToolResult } from "@app/ai-api";
import type {
  AgentConversation,
  VaultMutationBackend,
  WebSearchBackend,
} from "@app/ai-agent";
import { detectCliAgents } from "./cliAgentBridge";
import { CLI_AGENT_CATALOG, type CliAgentId } from "./cliAgentTypes";
import type { CliRunCallbacks } from "./useCliAgentExecution";
import type { ChatMessageItem } from "./agentTypes";
import {
  autoSavePromptMemory,
  loadMemoryContext,
} from "./agentMemoryPersistence";
import { buildCliAgentPrompt } from "./buildCliAgentPrompt";
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
            (r: { title: string; url: string; snippet: string }, i: number) =>
              `${i + 1}. ${r.title}\nURL: ${r.url}\n${r.snippet}`,
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
      (m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content.trim()}`,
    )
    .join("\n\n");

  // 5. Shared Context from Sister Conversations in this Project
  const sisterContext = resolveProjectSisterConversationsContext({
    projectId,
    currentConversationId: activeConversationId,
    conversations,
    projectName,
  });

  const vName =
    projectName ||
    vaultName ||
    (vaultPath ? vaultPath.split(/[/\\]/).pop() || "Vault" : "Vault");

  const finalPrompt = await buildCliAgentPrompt({
    vaultName: vName,
    vaultPath,
    allNotePaths,
    memoryContext,
    projectName,
    projectInstructions,
    sisterContext,
    projectSources,
    mutationBackend,
    webSearchContext,
    historyTurns,
    promptText,
  });

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
