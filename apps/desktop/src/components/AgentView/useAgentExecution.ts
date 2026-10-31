import { useState, useCallback, useRef, useEffect } from "react";
import type { StructuredUserRequest } from "@app/ai-agent";
import {
  createDesktopInspectionBackend,
  createDesktopMutationBackend,
  createDesktopWebSearchBackend,
} from "./desktopAgentBridge.js";
import {
  createConfiguredProvider,
  loadSelectedProvider,
  type AIProviderId,
} from "../../ai/AISubsystem.js";
import { useWorkspaceStore } from "../../state/useWorkspaceStore.js";
import { useAgentLedger } from "./useAgentLedger.js";
import { buildAgentWorkingHistory } from "./agentSystemPrompt.js";
import {
  resolveExecutionPromptAndTools,
  executeRewriteAndClarify,
} from "./agentPromptResolver.js";
import {
  appendAssistantChunk,
  finalizeAssistantMessage,
  executeCliAgentSession,
  prepareUserMessage,
  findPriorUserPrompt,
  findMessageSlice,
} from "./agentExecutionHelpers.js";
import { runAgentStepLoop } from "./agentStepLoop.js";
import { useCliAgentExecution } from "./useCliAgentExecution.js";
import type {
  ChatMessageItem,
  StagedChangeItem,
  ChatAttachmentItem,
  MentionItem,
} from "./agentTypes.js";

export interface UseAgentExecutionOptions {
  providerId?: AIProviderId;
  model?: string;
  webSearchEnabled?: boolean;
  autoApply?: boolean;
  vaultName?: string;
  rewriteEnabled?: boolean;
  selectedCliAgent?: string | null;
  vaultPath?: string;
}

export function useAgentExecution(options?: UseAgentExecutionOptions) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [stagedChanges, setStagedChanges] = useState<StagedChangeItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoApply, setAutoApply] = useState(options?.autoApply ?? true);
  const [lastStructuredRequest, setLastStructuredRequest] =
    useState<StructuredUserRequest | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (options?.autoApply !== undefined) setAutoApply(options.autoApply);
  }, [options?.autoApply]);

  const inspectionBackend = useRef(createDesktopInspectionBackend()).current;
  const mutationBackend = useRef(createDesktopMutationBackend()).current;
  const webSearchBackend = useRef(createDesktopWebSearchBackend()).current;
  const ledgerMethods = useAgentLedger(mutationBackend, setStagedChanges);
  const { handleApplyChange, handleApplyAllChanges } = ledgerMethods;
  const { cliSession, runCliPrompt, cancelActiveCliSession } =
    useCliAgentExecution();

  const sendMessage = useCallback(
    async (
      promptText: string,
      attachments?: ChatAttachmentItem[],
      mentions?: MentionItem[],
    ) => {
      const state = useWorkspaceStore.getState();
      const { userMsg, promptWithContext } = await prepareUserMessage(
        promptText,
        attachments,
        mentions,
        state.allNotePaths,
      );
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      abortRef.current = new AbortController();
      setIsStreaming(true);

      try {
        if (options?.selectedCliAgent) {
          const vault = options.vaultPath || state.vaultPath || "";
          await executeCliAgentSession(
            options.selectedCliAgent,
            promptWithContext,
            vault,
            runCliPrompt,
            setMessages,
          );
          return;
        }

        const providerId =
          options?.providerId ?? (await loadSelectedProvider());
        const provider = await createConfiguredProvider(
          providerId,
          options?.model,
        );

        let structuredRequest: StructuredUserRequest | null = null;
        if (options?.rewriteEnabled) {
          const res = await executeRewriteAndClarify(promptText, provider);
          structuredRequest = res.structuredRequest;
          setLastStructuredRequest(structuredRequest);
          if (res.clarificationQuestion) {
            setMessages((prev) => [
              ...prev,
              {
                id: `msg_a_${Date.now()}`,
                role: "assistant",
                content: res.clarificationQuestion!,
                timestamp: Date.now(),
              },
            ]);
            return;
          }
        }

        const state = useWorkspaceStore.getState();
        const { systemPrompt, activeTools } =
          await resolveExecutionPromptAndTools({
            options,
            structuredRequest,
            provider,
            promptText,
            vaultPath: state.vaultPath,
            allNotePaths: state.allNotePaths ?? [],
            allFolderPaths: state.allFolderPaths ?? [],
            mutationBackend,
          });

        const workingHistory = buildAgentWorkingHistory(
          systemPrompt,
          nextMessages,
        );

        const assistantMsgId = `msg_a_${Date.now() + 1}`;

        await runAgentStepLoop({
          provider,
          workingHistory,
          activeTools,
          promptText,
          abortSignal: abortRef.current?.signal,
          onAssistantChunk: (chunk: string) => {
            setMessages((prev) =>
              appendAssistantChunk(prev, assistantMsgId, chunk),
            );
          },
          onAssistantMessage: (msg) => {
            setMessages((prev) =>
              finalizeAssistantMessage(prev, assistantMsgId, msg),
            );
          },
          stepContext: {
            webSearchEnabled: options?.webSearchEnabled,
            autoApply,
            webSearchBackend,
            mutationBackend,
            inspectionBackend,
            allNotePaths: state.allNotePaths ?? [],
            handleApplyChange,
            setStagedChanges,
          },
        });
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_err_${Date.now()}`,
            role: "assistant",
            content: `Error: ${err instanceof Error ? err.message : "Failed to run agent"}`,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [
      autoApply,
      handleApplyChange,
      inspectionBackend,
      messages,
      mutationBackend,
      options,
      runCliPrompt,
      webSearchBackend,
    ],
  );

  const abortExecution = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    void cancelActiveCliSession();
    setIsStreaming(false);
  }, [cancelActiveCliSession]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStagedChanges([]);
    setLastStructuredRequest(null);
  }, []);

  const handleBatchApply = useCallback(async () => {
    await handleApplyAllChanges(
      stagedChanges.filter((i) => i.status === "pending"),
    );
  }, [handleApplyAllChanges, stagedChanges]);

  const handleEditMessage = useCallback(
    async (messageId: string, newText: string) => {
      const prior = findMessageSlice(messages, messageId);
      if (!prior) return;
      setMessages(prior);
      await sendMessage(newText);
    },
    [messages, sendMessage],
  );

  const handleRegenerateMessage = useCallback(
    async (assistantMsgId: string) => {
      const match = findPriorUserPrompt(messages, assistantMsgId);
      if (!match?.prompt) return;
      setMessages(match.prior);
      await sendMessage(match.prompt);
    },
    [messages, sendMessage],
  );

  return {
    messages,
    stagedChanges,
    isStreaming,
    autoApply,
    setAutoApply,
    lastStructuredRequest,
    cliSession,
    cancelActiveCliSession,
    ...ledgerMethods,
    handleApplyAllChanges: handleBatchApply,
    sendMessage,
    handleEditMessage,
    handleRegenerateMessage,
    abortExecution,
    clearMessages,
    setMessages,
  };
}
