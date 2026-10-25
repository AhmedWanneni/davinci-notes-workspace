import { useState, useCallback, useRef, useEffect } from "react";
import { executeRewriteStep, type StructuredUserRequest } from "@app/ai-agent";
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
import {
  buildAgentSystemPrompt,
  buildAgentWorkingHistory,
} from "./agentSystemPrompt.js";
import { prepareActiveTools } from "./executeAgentStepTool.js";
import { runAgentStepLoop } from "./agentStepLoop.js";
import type { ChatMessageItem, StagedChangeItem } from "./agentTypes.js";

export interface UseAgentExecutionOptions {
  providerId?: AIProviderId;
  model?: string;
  webSearchEnabled?: boolean;
  autoApply?: boolean;
  vaultName?: string;
  rewriteEnabled?: boolean;
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
        }

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

        await runAgentStepLoop({
          provider,
          workingHistory,
          activeTools,
          promptText,
          abortSignal: abortRef.current?.signal,
          onAssistantMessage: (msg) => setMessages((prev) => [...prev, msg]),
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
    ...ledgerMethods,
    handleApplyAllChanges: handleBatchApply,
    sendMessage,
    abortExecution,
    clearMessages,
    setMessages,
  };
}
