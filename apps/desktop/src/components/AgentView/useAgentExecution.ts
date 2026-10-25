import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage } from "@app/ai-api";
import { VAULT_MUTATION_TOOLS } from "@app/ai-agent";
import { extractConversationalToolCall } from "@app/ai-runtime";
import {
  createDesktopInspectionBackend,
  createDesktopMutationBackend,
  createDesktopWebSearchBackend,
} from "./desktopAgentBridge";
import {
  createConfiguredProvider,
  loadSelectedProvider,
  type AIProviderId,
} from "../../ai/AISubsystem";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { useAgentLedger } from "./useAgentLedger";
import {
  buildAgentSystemPrompt,
  buildAgentWorkingHistory,
} from "./agentSystemPrompt";
import {
  executeAgentStepTool,
  prepareActiveTools,
} from "./executeAgentStepTool";
import type { ChatMessageItem, StagedChangeItem } from "./agentTypes";

export interface UseAgentExecutionOptions {
  providerId?: AIProviderId;
  model?: string;
  webSearchEnabled?: boolean;
  autoApply?: boolean;
  vaultName?: string;
}

const MAX_AGENT_STEPS = 5;

export function useAgentExecution(options?: UseAgentExecutionOptions) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [stagedChanges, setStagedChanges] = useState<StagedChangeItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoApply, setAutoApply] = useState(options?.autoApply ?? true);
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
        const providerId =
          options?.providerId ?? (await loadSelectedProvider());
        const provider = await createConfiguredProvider(
          providerId,
          options?.model,
        );

        const state = useWorkspaceStore.getState();
        const vName =
          options?.vaultName ??
          (state.vaultPath
            ? state.vaultPath.split(/[/\\]/).pop() || "Vault"
            : "Vault");
        const systemPrompt = buildAgentSystemPrompt({
          vaultName: vName,
          allNotePaths: state.allNotePaths ?? [],
          allFolderPaths: state.allFolderPaths ?? [],
        });

        const activeTools = prepareActiveTools(options?.webSearchEnabled);
        const workingHistory = buildAgentWorkingHistory(
          systemPrompt,
          nextMessages,
        );

        let finalResponseReceived = false;
        let hasExecutedMutation = false;

        for (let step = 0; step < MAX_AGENT_STEPS; step++) {
          if (abortRef.current?.signal.aborted) break;

          const res = await provider.complete({
            messages: workingHistory,
            tools: activeTools,
          });

          let effectiveToolCalls = res.toolCalls;
          if (
            (!effectiveToolCalls || effectiveToolCalls.length === 0) &&
            !hasExecutedMutation &&
            res.content
          ) {
            const fallbackCall = extractConversationalToolCall(
              res.content,
              promptText,
            );
            if (fallbackCall) {
              effectiveToolCalls = [fallbackCall];
            }
          }

          if (effectiveToolCalls && effectiveToolCalls.length > 0) {
            workingHistory.push({
              role: "assistant",
              content: res.content || "",
              toolCalls: effectiveToolCalls,
            });

            for (const tc of effectiveToolCalls) {
              const toolResult = await executeAgentStepTool(tc, {
                webSearchEnabled: options?.webSearchEnabled,
                autoApply,
                webSearchBackend,
                mutationBackend,
                inspectionBackend,
                allNotePaths: state.allNotePaths ?? [],
                handleApplyChange,
                setStagedChanges,
              });

              if (
                VAULT_MUTATION_TOOLS.some((t) => t.name === tc.name) ||
                tc.name.startsWith("create_")
              ) {
                hasExecutedMutation = true;
              }

              workingHistory.push({
                role: "tool",
                name: tc.name,
                toolCallId: tc.id,
                content:
                  typeof toolResult === "string"
                    ? toolResult
                    : JSON.stringify(toolResult),
              });
            }
          } else {
            const assistantMsg: ChatMessageItem = {
              id: `msg_a_${Date.now()}`,
              role: "assistant",
              content: res.content,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
            finalResponseReceived = true;
            break;
          }
        }

        if (!finalResponseReceived && workingHistory.length > 0) {
          const lastMsg = workingHistory[workingHistory.length - 1];
          if (lastMsg.role === "assistant" && lastMsg.content) {
            setMessages((prev) => [
              ...prev,
              {
                id: `msg_a_${Date.now()}`,
                role: "assistant",
                content: lastMsg.content,
                timestamp: Date.now(),
              },
            ]);
          }
        }
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
      options?.model,
      options?.providerId,
      options?.vaultName,
      options?.webSearchEnabled,
      webSearchBackend,
    ],
  );

  const abortExecution = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStagedChanges([]);
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
    ...ledgerMethods,
    handleApplyAllChanges: handleBatchApply,
    sendMessage,
    abortExecution,
    clearMessages,
    setMessages,
  };
}
