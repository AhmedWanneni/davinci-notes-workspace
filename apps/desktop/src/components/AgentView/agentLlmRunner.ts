import type { StructuredUserRequest, VaultInspectionBackend, VaultMutationBackend } from "@app/ai-agent";
import type { WebSearchBackend } from "./desktopAgentBridge.js";
import {
  createConfiguredProvider,
  loadSelectedProvider,
  type AIProviderId,
} from "../../ai/AISubsystem.js";
import { useWorkspaceStore } from "../../state/useWorkspaceStore.js";
import { buildAgentWorkingHistory } from "./agentSystemPrompt.js";
import {
  resolveExecutionPromptAndTools,
  resolveRewriteClarification,
} from "./agentPromptResolver.js";
import { runAgentStepLoop } from "./agentStepLoop.js";
import { useAgentStore } from "./useAgentStore.js";
import type { ChatMessageItem, StagedChangeItem } from "./agentTypes.js";
import type { UseAgentExecutionOptions } from "./useAgentExecution.js";

export interface ExecuteLlmParams {
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
}

export async function executeInternalLlmSession(
  params: ExecuteLlmParams,
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
  } = params;

  const providerId =
    options?.providerId ?? (await loadSelectedProvider());
  const provider = await createConfiguredProvider(
    providerId,
    options?.model,
  );

  let structuredRequest: StructuredUserRequest | null = null;
  if (options?.rewriteEnabled) {
    appendLog("Routing intent and checking clarification...");
    const res = await resolveRewriteClarification(provider, activePromptText);
    structuredRequest = res.structuredRequest;
    setLastStructuredRequest(structuredRequest);
    if (res.clarificationQuestion) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: res.clarificationQuestion!,
                isStreaming: false,
              }
            : m,
        ),
      );
      return;
    }
  }

  const state = useWorkspaceStore.getState();
  const effectiveOptions = { ...options, webSearchEnabled: isWebSearch };
  const { systemPrompt, activeTools } =
    await resolveExecutionPromptAndTools({
      options: effectiveOptions,
      structuredRequest,
      provider,
      promptText: activePromptText,
      vaultPath: state.vaultPath,
      allNotePaths: state.allNotePaths ?? [],
      allFolderPaths: state.allFolderPaths ?? [],
      mutationBackend,
      systemAugmentation,
    });

  const workingHistory = buildAgentWorkingHistory(
    systemPrompt,
    nextMessages,
  );

  await runAgentStepLoop({
    provider,
    workingHistory,
    activeTools,
    promptText: activePromptText,
    abortSignal,
    onStepLog: appendLog,
    onAssistantChunk: (chunk: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: m.content + chunk, isStreaming: true }
            : m,
        ),
      );
    },
    onAssistantMessage: (msg) => {
      setMessages((prev) => {
        const updated = prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...msg,
                id: assistantMsgId,
                logs: [...logs, "Done."],
                isStreaming: false,
              }
            : m,
        );
        void useAgentStore.getState().saveActiveMessages(updated);
        return updated;
      });
    },
    stepContext: {
      projectId: options?.projectId,
      webSearchEnabled: isWebSearch,
      autoApply,
      webSearchBackend,
      mutationBackend,
      inspectionBackend,
      allNotePaths: state.allNotePaths ?? [],
      handleApplyChange,
      setStagedChanges,
    },
  });
}
