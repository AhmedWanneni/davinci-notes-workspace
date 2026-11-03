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
  resolveRewriteClarification,
} from "./agentPromptResolver.js";
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
  projectSources?: string[];
  projectInstructions?: string;
  projectName?: string;
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
  const { cliSession, runCliPrompt, cancelActiveCliSession } =
    useCliAgentExecution();

  const sendMessage = useCallback(
    async (promptText: string, images?: string[]) => {
      const userMsg: ChatMessageItem = {
        id: `msg_u_${Date.now()}`,
        role: "user",
        content: promptText,
        images,
        timestamp: Date.now(),
      };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      abortRef.current = new AbortController();
      setIsStreaming(true);

      const assistantMsgId = `msg_a_${Date.now() + 1}`;
      const logs: string[] = [];
      const appendLog = (entry: string) => {
        logs.push(entry);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, logs: [...logs] } : m,
          ),
        );
      };

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          logs: ["Analyzing request and context..."],
          isStreaming: true,
          timestamp: Date.now(),
        },
      ]);

      try {
        if (options?.selectedCliAgent) {
          const meta =
            CLI_AGENT_CATALOG[options.selectedCliAgent as CliAgentId];
          const name = meta?.name || options.selectedCliAgent;
          const vault =
            options.vaultPath || useWorkspaceStore.getState().vaultPath || "";
          appendLog(`Starting CLI Agent: ${name}...`);
          await runCliPrompt(
            options.selectedCliAgent as CliAgentId,
            name,
            promptText,
            vault,
            (output) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: output,
                        logs: [...logs, "Completed CLI execution."],
                        isStreaming: false,
                      }
                    : m,
                ),
              );
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
          appendLog("Routing intent and checking clarification...");
          const res = await resolveRewriteClarification(provider, promptText);
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

        await runAgentStepLoop({
          provider,
          workingHistory,
          activeTools,
          promptText,
          abortSignal: abortRef.current?.signal,
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
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...msg,
                      id: assistantMsgId,
                      logs: [...logs, "Done."],
                      isStreaming: false,
                    }
                  : m,
              ),
            );
          },
          stepContext: {
            webSearchEnabled: options?.webSearchEnabled,
            autoApply,
            webSearchBackend,
            mutationBackend,
            inspectionBackend,
            allNotePaths: state.allNotePaths ?? [],
            handleApplyChange: ledgerMethods.handleApplyChange,
            setStagedChanges,
          },
        });
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `Error: ${err instanceof Error ? err.message : "Failed to run agent"}`,
                  isStreaming: false,
                }
              : m,
          ),
        );
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [
      autoApply,
      inspectionBackend,
      ledgerMethods.handleApplyChange,
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
    await ledgerMethods.handleApplyAllChanges(pending);
  }, [ledgerMethods, stagedChanges]);

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
