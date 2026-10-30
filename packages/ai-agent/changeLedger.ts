import {
  CURRENT_LEDGER_VERSION,
  MAX_LEDGER_TRANSACTIONS,
  type AgentTransaction,
  type ChangeLedgerData,
  type FileChangeRecord,
} from "./changeLedgerTypes.js";

export function parseChangeLedger(rawJson: string | null | undefined): ChangeLedgerData {
  const empty: ChangeLedgerData = {
    version: CURRENT_LEDGER_VERSION,
    transactions: [],
  };

  if (!rawJson || typeof rawJson !== "string") {
    return empty;
  }

  try {
    const parsed = JSON.parse(rawJson) as Partial<ChangeLedgerData>;
    if (parsed.version !== CURRENT_LEDGER_VERSION || !Array.isArray(parsed.transactions)) {
      return empty;
    }

    const validTransactions = parsed.transactions.filter(
      (tx): tx is AgentTransaction =>
        typeof tx.transactionId === "string" &&
        typeof tx.timestamp === "number" &&
        typeof tx.prompt === "string" &&
        Array.isArray(tx.changes),
    );

    return {
      version: CURRENT_LEDGER_VERSION,
      transactions: validTransactions.slice(-MAX_LEDGER_TRANSACTIONS),
    };
  } catch {
    return empty;
  }
}

export function serializeChangeLedger(ledger: ChangeLedgerData): string {
  const trimmed: ChangeLedgerData = {
    version: CURRENT_LEDGER_VERSION,
    transactions: ledger.transactions.slice(-MAX_LEDGER_TRANSACTIONS),
  };
  return JSON.stringify(trimmed, null, 2);
}

export function appendTransactionToLedger(
  ledger: ChangeLedgerData,
  transaction: AgentTransaction,
): ChangeLedgerData {
  return {
    version: CURRENT_LEDGER_VERSION,
    transactions: [...ledger.transactions, transaction].slice(-MAX_LEDGER_TRANSACTIONS),
  };
}

export function markTransactionUndone(
  ledger: ChangeLedgerData,
  transactionId: string,
): ChangeLedgerData {
  return {
    version: CURRENT_LEDGER_VERSION,
    transactions: ledger.transactions.map((tx) =>
      tx.transactionId === transactionId ? { ...tx, undone: true } : tx,
    ),
  };
}

/**
 * Compute the reverse operations to invert a transaction.
 * Inverts the change list in reverse order (LIFO).
 */
export function computeRollbackOperations(
  transaction: AgentTransaction,
): FileChangeRecord[] {
  const inverted: FileChangeRecord[] = [];

  for (let i = transaction.changes.length - 1; i >= 0; i -= 1) {
    const c = transaction.changes[i];
    switch (c.action) {
      case "create":
        // Inverse of create is delete
        inverted.push({
          action: "delete",
          path: c.path,
          beforeContent: c.afterContent,
          afterContent: null,
        });
        break;

      case "modify":
        // Inverse of modify is restoring beforeContent
        inverted.push({
          action: "modify",
          path: c.path,
          beforeContent: c.afterContent,
          afterContent: c.beforeContent,
        });
        break;

      case "delete":
        // Inverse of delete is re-creating beforeContent
        inverted.push({
          action: "create",
          path: c.path,
          beforeContent: null,
          afterContent: c.beforeContent,
        });
        break;

      case "move":
        // Inverse of move is moving back from target to source
        inverted.push({
          action: "move",
          path: c.fromPath ?? c.path,
          fromPath: c.path,
          beforeContent: c.afterContent,
          afterContent: c.beforeContent,
        });
        break;
    }
  }

  return inverted;
}
