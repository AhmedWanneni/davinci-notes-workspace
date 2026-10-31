import { useState, useCallback, useRef, useEffect } from "react";
import {
  executeRewriteStep,
  shouldClarifyRequest,
  type StructuredUserRequest,
} from "@app/ai-agent";
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
import { resolveExecutionPromptAndTools } from "./agentPromptResolver.js";
import { runAgentStepLoop } from "./agentStepLoop.js";
import { useCliAgentExecution } from "./useCliAgentExecution.js";
import { CLI_AGENT_CATALOG, type CliAgentId } from "./cliAgentTypes.js";
import type { ChatMessageItem, StagedChangeItem } from "./agentTypes.js";

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
    async (promptText: string) => {
      const userMsg: ChatMessageItem = {
        id: `msg_u_${Date.now()}`,
        role: "user",
        content: promptText,
        timestamp: Date.now(),
      };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      abortRef.current = new AbortController();
      setIsStreaming(true);

      try {
        if (options?.selectedCliAgent) {
          const meta =
            CLI_AGENT_CATALOG[options.selectedCliAgent as CliAgentId];
          const name = meta?.name || options.selectedCliAgent;
          const vault =
            options.vaultPath || useWorkspaceStore.getState().vaultPath || "";
          await runCliPrompt(
            options.selectedCliAgent as CliAgentId,
            name,
            promptText,
            vault,
            (output) => {
              setMessages((prev) => [
                ...prev,
                {
                  id: `msg_a_${Date.now()}`,
                  role: "assistant",
                  content: output,
                  timestamp: Date.now(),
                },
              ]);
            },
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
          structuredRequest = await executeRewriteStep(
            promptText,
            async (prompt) => {
              const res = await provider.complete({
                messages: [{ role: "user", content: prompt }],
              });
              return res.content || "";
            },
          );
          setLastStructuredRequest(structuredRequest);

          const clarification = shouldClarifyRequest(structuredRequest);
          if (clarification.needsClarification && clarification.question) {
            setMessages((prev) => [
              ...prev,
              {
                id: `msg_a_${Date.now()}`,
                role: "assistant",
                content: clarification.question!,
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
            setMessages((prev) => {
              const existing = prev.find((m) => m.id === assistantMsgId);
              if (existing) {
                return prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + chunk, isStreaming: true }
                    : m,
                );
              }
              return [
                ...prev,
                {
                  id: assistantMsgId,
                  role: "assistant",
                  content: chunk,
                  isStreaming: true,
                  timestamp: Date.now(),
                },
              ];
            });
          },
          onAssistantMessage: (msg) => {
            setMessages((prev) => {
              const filtered = prev.filter((m) => m.id !== assistantMsgId);
              return [...filtered, { ...msg, isStreaming: false }];
            });
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
    abortExecution,
    clearMessages,
    setMessages,
  };
}
