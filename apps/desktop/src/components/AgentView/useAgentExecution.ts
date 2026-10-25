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
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { useAgentLedger } from "./useAgentLedger";
import { buildAgentSystemPrompt } from "./agentSystemPrompt";
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

        const activeTools = options?.webSearchEnabled
          ? [
              ...VAULT_INSPECTION_TOOLS,
              ...VAULT_MUTATION_TOOLS,
              WEB_SEARCH_TOOL,
            ]
          : [...VAULT_INSPECTION_TOOLS, ...VAULT_MUTATION_TOOLS];

        const workingHistory: ChatMessage[] = [
          { role: "system", content: systemPrompt },
          ...nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
            toolCalls: m.toolCalls,
            toolCallId: m.toolCallId,
            name: m.name,
          })),
        ];

        let finalResponseReceived = false;

        for (let step = 0; step < MAX_AGENT_STEPS; step++) {
          if (abortRef.current?.signal.aborted) break;

          const res = await provider.complete({
            messages: workingHistory,
            tools: activeTools,
          });

          if (res.toolCalls && res.toolCalls.length > 0) {
            workingHistory.push({
              role: "assistant",
              content: res.content || "",
              toolCalls: res.toolCalls,
            });

            for (const tc of res.toolCalls) {
              let toolResult: unknown;
              const isMutation =
                VAULT_MUTATION_TOOLS.some((t) => t.name === tc.name) ||
                tc.name.startsWith("create_");
              if (tc.name === "web_search" && options?.webSearchEnabled) {
                toolResult = await executeWebSearchTool(
                  tc.arguments,
                  webSearchBackend,
                );
              } else if (isMutation) {
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
                  toolResult = {
                    status: "applied",
                    action: tc.name,
                    path: plan.changeRecord.path,
                  };
                } else {
                  setStagedChanges((prev) => [...prev, stagedItem]);
                  toolResult = {
                    status: "staged_for_approval",
                    action: tc.name,
                    path: plan.changeRecord.path,
                  };
                }
              } else {
                const pathArg = String(tc.arguments.path ?? "").trim();
                if (
                  (pathArg === "Your_Note_Path" || !pathArg) &&
                  tc.name === "read_note"
                ) {
                  toolResult = {
                    error: "Please specify a real note path from the vault.",
                    availableNotes: (state.allNotePaths ?? []).slice(0, 10),
                  };
                } else {
                  toolResult = await executeInspectionTool(
                    tc.name,
                    tc.arguments,
                    inspectionBackend,
                  );
                }
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
