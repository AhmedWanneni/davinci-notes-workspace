import { useState, useCallback } from "react";
import {
  parseChangeLedger,
  serializeChangeLedger,
  appendTransactionToLedger,
  computeRollbackOperations,
  markTransactionUndone,
  applyPlannedMutation,
  type AgentTransaction,
  type ChangeLedgerData,
  type VaultMutationBackend,
  AGENT_HISTORY_PATH,
} from "@app/ai-agent";
import { readNote, writeNote } from "../../vault/vaultCommands";
import type { StagedChangeItem } from "./agentTypes";

export function useAgentLedger(
  mutationBackend: VaultMutationBackend,
  setStagedChanges: React.Dispatch<React.SetStateAction<StagedChangeItem[]>>,
) {
  const [ledger, setLedger] = useState<ChangeLedgerData>({
    version: 1,
    transactions: [],
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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

  const rollback = useCallback(
    async (transactionId: string) => {
      const tx = ledger.transactions.find(
        (t) => t.transactionId === transactionId,
      );
      if (!tx || tx.undone) return;
      const rollbackOps = computeRollbackOperations(tx);
      for (const op of rollbackOps) {
        await applyPlannedMutation(op, mutationBackend);
      }
      const updated = markTransactionUndone(ledger, transactionId);
      await saveLedger(updated);
    },
    [ledger, mutationBackend, saveLedger],
  );

  const handleApplyChange = useCallback(
    async (item: StagedChangeItem) => {
      await applyPlannedMutation(item.plan.changeRecord, mutationBackend);
      setStagedChanges((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "accepted" } : i)),
      );
      const tx: AgentTransaction = {
        transactionId: `tx_${Date.now()}`,
        timestamp: Date.now(),
        prompt: `Applied ${item.plan.changeRecord.action} on ${item.plan.changeRecord.path}`,
        changes: [item.plan.changeRecord],
      };
      await saveLedger(appendTransactionToLedger(ledger, tx));
    },
    [ledger, mutationBackend, saveLedger, setStagedChanges],
  );

  const handleRejectChange = useCallback(
    (item: StagedChangeItem) => {
      setStagedChanges((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "rejected" } : i)),
      );
    },
    [setStagedChanges],
  );

  const handleApplyAllChanges = useCallback(
    async (pending: StagedChangeItem[]) => {
      if (pending.length === 0) return;
      const changes = [];
      for (const item of pending) {
        await applyPlannedMutation(item.plan.changeRecord, mutationBackend);
        changes.push(item.plan.changeRecord);
      }
      setStagedChanges((prev) =>
        prev.map((i) =>
          i.status === "pending" ? { ...i, status: "accepted" } : i,
        ),
      );
      const tx: AgentTransaction = {
        transactionId: `tx_${Date.now()}`,
        timestamp: Date.now(),
        prompt: `Batch applied ${changes.length} changes`,
        changes,
      };
      await saveLedger(appendTransactionToLedger(ledger, tx));
    },
    [ledger, mutationBackend, saveLedger, setStagedChanges],
  );

  return {
    ledger,
    isHistoryOpen,
    setIsHistoryOpen,
    loadLedger,
    saveLedger,
    rollback,
    handleApplyChange,
    handleRejectChange,
    handleApplyAllChanges,
  };
}
