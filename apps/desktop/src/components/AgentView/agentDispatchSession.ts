import type { StructuredUserRequest, VaultInspectionBackend, VaultMutationBackend } from "@app/ai-agent";
import type { WebSearchBackend } from "./desktopAgentBridge.js";
import { useWorkspaceStore } from "../../state/useWorkspaceStore.js";
import { type CliAgentId } from "./cliAgentTypes.js";
import { executeCliAgentSession } from "./agentCliRunner.js";
import { executeInternalLlmSession } from "./agentLlmRunner.js";
import { autoSavePromptMemory } from "./agentMemoryPersistence.js";
import { useAgentStore } from "./useAgentStore.js";
import type { CliRunCallbacks } from "./useCliAgentExecution.js";
import type { ChatMessageItem, StagedChangeItem } from "./agentTypes.js";
import type { UseAgentExecutionOptions } from "./useAgentExecution.js";

export interface DispatchSessionParams {
  options?: UseAgentExecutionOptions;
  activePromptText: string;
  systemAugmentation?: string;
  isWebSearch: boolean;
  nextMessages: ChatMessageItem[];
  assistantMsgId: string;
  abortSignal?: AbortSignal;
  logs: string[];
  appendLog: (entry: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageItem[]>>;
  setLastStructuredRequest: (req: StructuredUserRequest | null) => void;
  mutationBackend: VaultMutationBackend;
  inspectionBackend: VaultInspectionBackend;
  webSearchBackend: WebSearchBackend;
  autoApply: boolean;
  handleApplyChange: (item: StagedChangeItem) => Promise<void>;
  setStagedChanges: React.Dispatch<React.SetStateAction<StagedChangeItem[]>>;
  runCliPrompt: (
    agentId: CliAgentId,
    agentName: string,
    promptText: string,
    vaultPath: string,
    callbacks?: CliRunCallbacks,
  ) => Promise<void>;
}

export async function dispatchAgentSession(
  params: DispatchSessionParams,
): Promise<void> {
  const {
    options,
    activePromptText,
    systemAugmentation,
    isWebSearch,
    nextMessages,
    assistantMsgId,
    abortSignal,
    logs,
    appendLog,
    setMessages,
    setLastStructuredRequest,
    mutationBackend,
    inspectionBackend,
    webSearchBackend,
    autoApply,
    handleApplyChange,
    setStagedChanges,
    runCliPrompt,
  } = params;

  await autoSavePromptMemory(
    activePromptText,
    mutationBackend,
    options?.projectId,
    appendLog,
  );

  if (options?.selectedCliAgent) {
    const state = useWorkspaceStore.getState();
    const vault = options?.vaultPath || state.vaultPath || "";
    const vName =
      options?.vaultName || (vault ? vault.split(/[/\\]/).pop() || "Vault" : "Vault");
    await executeCliAgentSession({
      agentId: options.selectedCliAgent as CliAgentId,
      promptText: activePromptText,
      vaultPath: vault,
      vaultName: vName,
      allNotePaths: state.allNotePaths ?? [],
      webSearchEnabled: isWebSearch,
      webSearchBackend,
      appendLog,
      appendChunk: (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: m.content + chunk, isStreaming: true }
              : m,
          ),
        );
      },
      runCliPrompt,
      onComplete: (output, toolCalls, toolResults) => {
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: output || m.content,
                  toolCalls: toolCalls ?? m.toolCalls,
                  toolResults: toolResults ?? m.toolResults,
                  logs: [...logs, "Execution complete."],
                  isStreaming: false,
                }
              : m,
          );
          void useAgentStore.getState().saveActiveMessages(updated);
          return updated;
        });
      },
      nextMessages,
      projectId: options?.projectId,
      projectSources: options?.projectSources,
      projectInstructions: options?.projectInstructions,
      projectName: options?.projectName,
      conversations: options?.conversations,
      activeConversationId: options?.activeConversationId,
      mutationBackend,
    });
    return;
  }

  await executeInternalLlmSession({
    options,
    activePromptText,
    systemAugmentation,
    isWebSearch,
    nextMessages,
    assistantMsgId,
    abortSignal,
    logs,
    appendLog,
    setMessages,
    setLastStructuredRequest,
    mutationBackend,
    inspectionBackend,
    webSearchBackend,
    autoApply,
    handleApplyChange,
    setStagedChanges,
  });
}
