import { useState, useCallback, useRef, useEffect } from "react";
import type { StructuredUserRequest } from "@app/ai-agent";
import {
  createDesktopInspectionBackend,
  createDesktopMutationBackend,
  createDesktopWebSearchBackend,
} from "./desktopAgentBridge.js";
import type { AIProviderId } from "../../ai/AISubsystem.js";
import { useWorkspaceStore } from "../../state/useWorkspaceStore.js";
import { useAgentLedger } from "./useAgentLedger.js";
import { useCliAgentExecution } from "./useCliAgentExecution.js";
import { resolveSlashCommand } from "./agentSlashCommandHandler.js";
import { dispatchAgentSession } from "./agentDispatchSession.js";
import { useAgentStore } from "./useAgentStore.js";
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
  projectId?: string;
  projectSources?: string[];
  projectInstructions?: string;
  projectName?: string;
  conversations?: import("@app/ai-agent").AgentConversation[];
  activeConversationId?: string;
}

export function useAgentExecution(options?: UseAgentExecutionOptions) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [stagedChanges, setStagedChanges] = useState<StagedChangeItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoApply, setAutoApply] = useState(options?.autoApply ?? true);
  const [lastStructuredRequest, setLastStructuredRequest] =
    useState<StructuredUserRequest | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const waitingForRevealRef = useRef(false);

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
      const slash = resolveSlashCommand(promptText, {
        providerId: options?.providerId,
        model: options?.model,
        selectedCliAgent: options?.selectedCliAgent,
        projectName: options?.projectName,
        projectId: options?.projectId,
        webSearchEnabled: options?.webSearchEnabled,
      });

      if (slash.handled) {
        if (slash.action === "clear") {
          setMessages([]);
          setStagedChanges([]);
          setLastStructuredRequest(null);
          return;
        }
        if (slash.action === "models") {
          useAgentStore.getState().setModelPickerOpen(true);
          return;
        }
        if (slash.directResponse) {
          const uId = `msg_u_${Date.now()}`;
          const aId = `msg_a_${Date.now() + 1}`;
          setMessages((prev) => [
            ...prev,
            { id: uId, role: "user", content: promptText, timestamp: Date.now() },
            { id: aId, role: "assistant", content: slash.directResponse!, isStreaming: false, timestamp: Date.now() + 1 },
          ]);
          return;
        }
      }

      const activePromptText = slash.processedPrompt || promptText;
      const isWebSearch = Boolean(
        options?.webSearchEnabled || slash.forceWebSearch,
      );

      const userMsg: ChatMessageItem = {
        id: `msg_u_${Date.now()}`,
        role: "user",
        content: promptText,
        images,
        timestamp: Date.now(),
      };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      void useAgentStore.getState().saveActiveMessages(nextMessages);
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
        await dispatchAgentSession({
          options,
          activePromptText,
          systemAugmentation: slash.systemAugmentation,
          isWebSearch,
          nextMessages,
          assistantMsgId,
          abortSignal: abortRef.current?.signal,
          logs,
          appendLog,
          setMessages,
          setLastStructuredRequest,
          mutationBackend,
          inspectionBackend,
          webSearchBackend,
          autoApply,
          handleApplyChange: ledgerMethods.handleApplyChange,
          setStagedChanges,
          runCliPrompt,
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
        waitingForRevealRef.current = false;
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
    waitingForRevealRef.current = false;
    void cancelActiveCliSession();
    setIsStreaming(false);
  }, [cancelActiveCliSession]);

  const completeResponseReveal = useCallback(() => {
    if (!waitingForRevealRef.current) return;
    waitingForRevealRef.current = false;
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
    completeResponseReveal,
    clearMessages,
    setMessages,
  };
}
