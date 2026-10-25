import { useState, useCallback, useRef } from "react";
import type { ChatMessage } from "@app/ai-api";
import {
  VAULT_INSPECTION_TOOLS,
  VAULT_MUTATION_TOOLS,
  executeInspectionTool,
  planMutation,
  applyPlannedMutation,
  parseChangeLedger,
  serializeChangeLedger,
  appendTransactionToLedger,
  computeRollbackOperations,
  markTransactionUndone,
  type AgentTransaction,
  type ChangeLedgerData,
  AGENT_HISTORY_PATH,
} from "@app/ai-agent";
import {
  createDesktopInspectionBackend,
  createDesktopMutationBackend,
} from "./desktopAgentBridge";
import {
  createConfiguredProvider,
  loadSelectedProvider,
} from "../../ai/AISubsystem";
import { readNote, writeNote } from "../../vault/vaultCommands";
import type { ChatMessageItem, StagedChangeItem } from "./agentTypes";

const ALL_AGENT_TOOLS = [...VAULT_INSPECTION_TOOLS, ...VAULT_MUTATION_TOOLS];

export function useAgentExecution() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [stagedChanges, setStagedChanges] = useState<StagedChangeItem[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoApply, setAutoApply] = useState(false);
  const [ledger, setLedger] = useState<ChangeLedgerData>({
    version: 1,
    transactions: [],
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const inspectionBackend = useRef(createDesktopInspectionBackend()).current;
  const mutationBackend = useRef(createDesktopMutationBackend()).current;

  const loadLedger = useCallback(async () => {
    try {
      const file = await readNote(AGENT_HISTORY_PATH);
      setLedger(parseChangeLedger(file.content));
    } catch {
      setLedger({ version: 1, transactions: [] });
    }
  }, []);

  const saveLedger = useCallback(async (nextLedger: ChangeLedgerData) => {
    setLedger(nextLedger);
    try {
      await writeNote(AGENT_HISTORY_PATH, serializeChangeLedger(nextLedger));
    } catch (e) {
      console.warn("[agent] Failed to save history ledger:", e);
    }
  }, []);

  const rollback = useCallback(async (transactionId: string) => {
    const tx = ledger.transactions.find((t) => t.transactionId === transactionId);
    if (!tx || tx.undone) return;
    const rollbackOps = computeRollbackOperations(tx);
    for (const op of rollbackOps) {
      await applyPlannedMutation(op, mutationBackend);
    }
    const updated = markTransactionUndone(ledger, transactionId);
    await saveLedger(updated);
  }, [ledger, mutationBackend, saveLedger]);

  const handleApplyChange = useCallback(async (item: StagedChangeItem) => {
    await applyPlannedMutation(item.plan.changeRecord, mutationBackend);
    setStagedChanges((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "accepted" } : i)));
    const tx: AgentTransaction = {
      transactionId: `tx_${Date.now()}`,
      timestamp: Date.now(),
      prompt: `Applied ${item.plan.changeRecord.action} on ${item.plan.changeRecord.path}`,
      changes: [item.plan.changeRecord],
    };
    await saveLedger(appendTransactionToLedger(ledger, tx));
  }, [ledger, mutationBackend, saveLedger]);

  const handleRejectChange = useCallback((item: StagedChangeItem) => {
    setStagedChanges((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "rejected" } : i)));
  }, []);

  const handleApplyAllChanges = useCallback(async () => {
    const pending = stagedChanges.filter((i) => i.status === "pending");
    if (pending.length === 0) return;
    const changes = [];
    for (const item of pending) {
      await applyPlannedMutation(item.plan.changeRecord, mutationBackend);
      changes.push(item.plan.changeRecord);
    }
    setStagedChanges((prev) => prev.map((i) => (i.status === "pending" ? { ...i, status: "accepted" } : i)));
    const tx: AgentTransaction = {
      transactionId: `tx_${Date.now()}`,
      timestamp: Date.now(),
      prompt: `Batch applied ${changes.length} changes`,
      changes,
    };
    await saveLedger(appendTransactionToLedger(ledger, tx));
  }, [ledger, mutationBackend, saveLedger, stagedChanges]);

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
        const providerId = await loadSelectedProvider();
        const provider = await createConfiguredProvider(providerId);

        const chatHistory: ChatMessage[] = nextMessages.map((m) => ({
          role: m.role,
          content: m.content,
          toolCalls: m.toolCalls,
        }));

        const res = await provider.complete({
          messages: chatHistory,
          tools: ALL_AGENT_TOOLS,
        });

        const assistantMsg: ChatMessageItem = {
          id: `msg_a_${Date.now()}`,
          role: "assistant",
          content: res.content,
          toolCalls: res.toolCalls,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // If tool calls are present, execute inspection or plan mutations
        if (res.toolCalls && res.toolCalls.length > 0) {
          for (const tc of res.toolCalls) {
            const isMutation = VAULT_MUTATION_TOOLS.some(
              (t) => t.name === tc.name,
            );
            if (isMutation) {
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

  return {
    messages,
    stagedChanges,
    isStreaming,
    autoApply,
    setAutoApply,
    ledger,
    isHistoryOpen,
    setIsHistoryOpen,
    loadLedger,
    rollback,
    handleApplyChange,
    handleRejectChange,
    handleApplyAllChanges,
    sendMessage,
    abortExecution,
    clearMessages,
    setMessages,
  };
}
