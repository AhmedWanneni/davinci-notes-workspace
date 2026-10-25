import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage } from "@app/ai-api";
import {
  VAULT_INSPECTION_TOOLS,
  VAULT_MUTATION_TOOLS,
  WEB_SEARCH_TOOL,
  executeInspectionTool,
  executeWebSearchTool,
  planMutation,
} from "@app/ai-agent";
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
import { useAgentLedger } from "./useAgentLedger";
import type { ChatMessageItem, StagedChangeItem } from "./agentTypes";

export interface UseAgentExecutionOptions {
  providerId?: AIProviderId;
  model?: string;
  webSearchEnabled?: boolean;
  autoApply?: boolean;
}

export function useAgentExecution(options?: UseAgentExecutionOptions) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [stagedChanges, setStagedChanges] = useState<StagedChangeItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoApply, setAutoApply] = useState(options?.autoApply ?? false);
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

        const chatHistory: ChatMessage[] = nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
          toolCalls: m.toolCalls,
        }));

        const activeTools = options?.webSearchEnabled
          ? [
              ...VAULT_INSPECTION_TOOLS,
              ...VAULT_MUTATION_TOOLS,
              WEB_SEARCH_TOOL,
            ]
          : [...VAULT_INSPECTION_TOOLS, ...VAULT_MUTATION_TOOLS];

        const res = await provider.complete({
          messages: chatHistory,
          tools: activeTools,
        });

        const assistantMsg: ChatMessageItem = {
          id: `msg_a_${Date.now()}`,
          role: "assistant",
          content: res.content,
          toolCalls: res.toolCalls,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (res.toolCalls && res.toolCalls.length > 0) {
          for (const tc of res.toolCalls) {
            if (tc.name === "web_search" && options?.webSearchEnabled) {
              await executeWebSearchTool(tc.arguments, webSearchBackend);
            } else if (VAULT_MUTATION_TOOLS.some((t) => t.name === tc.name)) {
              const plan = await planMutation(
                tc.name,
                tc.arguments,
                mutationBackend,
              );
              const stagedItem: StagedChangeItem = {
                id: `staged_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                toolName: tc.name,
                plan,
                status: "pending",
              };
              if (autoApply) {
                await handleApplyChange(stagedItem);
              } else {
                setStagedChanges((prev) => [...prev, stagedItem]);
              }
            } else {
              await executeInspectionTool(
                tc.name,
                tc.arguments,
                inspectionBackend,
              );
            }
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
