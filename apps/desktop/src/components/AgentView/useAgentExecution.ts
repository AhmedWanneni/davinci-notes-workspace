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
} from "./agentExecutionHelpers.js";
import { runAgentStepLoop } from "./agentStepLoop.js";
import { useCliAgentExecution } from "./useCliAgentExecution.js";
import { CLI_AGENT_CATALOG, type CliAgentId } from "./cliAgentTypes.js";
import type { ChatMessageItem, StagedChangeItem, ChatAttachmentItem } from "./agentTypes.js";

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
    if (options?.autoApply !== undefined) {
      setAutoApply(options.autoApply);
    }
  }, [options?.autoApply]);

  const inspectionBackend = useRef(createDesktopInspectionBackend()).current;
  const mutationBackend = useRef(createDesktopMutationBackend()).current;
  const webSearchBackend = useRef(createDesktopWebSearchBackend()).current;

  const ledgerMethods = useAgentLedger(mutationBackend, setStagedChanges);
  const { handleApplyChange, handleApplyAllChanges } = ledgerMethods;
  const { cliSession, runCliPrompt, cancelActiveCliSession } =
    useCliAgentExecution();

  const sendMessage = useCallback(
    async (promptText: string, attachments?: ChatAttachmentItem[]) => {
      const userMsg: ChatMessageItem = {
        id: `msg_u_${Date.now()}`, role: "user", content: promptText, attachments, timestamp: Date.now(),
      };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      abortRef.current = new AbortController();
      setIsStreaming(true);

      try {
        if (options?.selectedCliAgent) {
          const vault =
            options.vaultPath || useWorkspaceStore.getState().vaultPath || "";
          await executeCliAgentSession(
            options.selectedCliAgent,
            promptText,
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
            setMessages((prev) => appendAssistantChunk(prev, assistantMsgId, chunk));
          },
          onAssistantMessage: (msg) => {
            setMessages((prev) => finalizeAssistantMessage(prev, assistantMsgId, msg));
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
    const pending = stagedChanges.filter((i) => i.status === "pending");
    await handleApplyAllChanges(pending);
  }, [handleApplyAllChanges, stagedChanges]);

  const handleEditMessage = useCallback(
    async (messageId: string, newText: string) => {
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx === -1) return;
      const prior = messages.slice(0, idx);
      setMessages(prior);
      await sendMessage(newText);
    },
    [messages, sendMessage],
  );

  const handleRegenerateMessage = useCallback(
    async (assistantMsgId: string) => {
      const idx = messages.findIndex((m) => m.id === assistantMsgId);
      if (idx === -1) return;
      const userMsg = [...messages.slice(0, idx)]
        .reverse()
        .find((m) => m.role === "user");
      if (!userMsg) return;
      const prior = messages.slice(0, idx);
      setMessages(prior);
      await sendMessage(userMsg.content);
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
