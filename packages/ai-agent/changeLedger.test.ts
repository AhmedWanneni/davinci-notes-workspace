import { describe, expect, it } from "vitest";
import {
  appendTransactionToLedger,
  computeRollbackOperations,
  markTransactionUndone,
  parseChangeLedger,
  serializeChangeLedger,
} from "./changeLedger.js";
import type { AgentTransaction, ChangeLedgerData } from "./changeLedgerTypes.js";

describe("changeLedger", () => {
  it("handles missing or corrupted JSON safely", () => {
    expect(parseChangeLedger(null).transactions).toEqual([]);
    expect(parseChangeLedger("").transactions).toEqual([]);
    expect(parseChangeLedger("{ corrupt json").transactions).toEqual([]);
    expect(parseChangeLedger('{"version": 99}').transactions).toEqual([]);
  });

  it("appends and serializes transactions up to MAX_LEDGER_TRANSACTIONS", () => {
    let ledger: ChangeLedgerData = parseChangeLedger(null);
    const tx: AgentTransaction = {
      transactionId: "tx_123",
      timestamp: 1729851000,
      prompt: "Summarize notes",
      changes: [
        {
          action: "create",
          path: "Notes/Summary.md",
          beforeContent: null,
          afterContent: "# Summary",
        },
      ],
    };

    ledger = appendTransactionToLedger(ledger, tx);
    expect(ledger.transactions).toHaveLength(1);

    const json = serializeChangeLedger(ledger);
    const parsed = parseChangeLedger(json);
    expect(parsed.transactions[0].transactionId).toBe("tx_123");
    expect(parsed.transactions[0].changes[0].path).toBe("Notes/Summary.md");
  });

  it("marks transactions as undone", () => {
    let ledger = parseChangeLedger(null);
    ledger = appendTransactionToLedger(ledger, {
      transactionId: "tx_1",
      timestamp: 100,
      prompt: "test",
      changes: [],
    });
    expect(ledger.transactions[0].undone).toBeFalsy();

    ledger = markTransactionUndone(ledger, "tx_1");
    expect(ledger.transactions[0].undone).toBe(true);
  });

  it("computes exact inverse operations in LIFO order for rollback", () => {
    const tx: AgentTransaction = {
      transactionId: "tx_multi",
      timestamp: 200,
      prompt: "multi-file update",
      changes: [
        {
          action: "create",
          path: "Created.md",
          beforeContent: null,
          afterContent: "Created content",
        },
        {
          action: "modify",
          path: "Modified.md",
          beforeContent: "Original content",
          afterContent: "Modified content",
        },
        {
          action: "delete",
          path: "Deleted.md",
          beforeContent: "Deleted content",
          afterContent: null,
        },
        {
          action: "move",
          path: "Target.md",
          fromPath: "Source.md",
          beforeContent: "Moved content",
          afterContent: "Moved content",
        },
      ],
    };

    const rollbackOps = computeRollbackOperations(tx);
    expect(rollbackOps).toHaveLength(4);

    // LIFO 1: reverse of move is move back
    expect(rollbackOps[0]).toEqual({
      action: "move",
      path: "Source.md",
      fromPath: "Target.md",
      beforeContent: "Moved content",
      afterContent: "Moved content",
    });

    // LIFO 2: reverse of delete is create
    expect(rollbackOps[1]).toEqual({
      action: "create",
      path: "Deleted.md",
      beforeContent: null,
      afterContent: "Deleted content",
    });

    // LIFO 3: reverse of modify is modify back
    expect(rollbackOps[2]).toEqual({
      action: "modify",
      path: "Modified.md",
      beforeContent: "Modified content",
      afterContent: "Original content",
    });

    // LIFO 4: reverse of create is delete
    expect(rollbackOps[3]).toEqual({
      action: "delete",
      path: "Created.md",
      beforeContent: "Created content",
      afterContent: null,
    });
  });
});
