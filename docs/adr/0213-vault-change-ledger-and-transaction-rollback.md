# ADR-0213: Vault Change Ledger and Transaction Rollback

## Status

Accepted (extends ADR-0004, ADR-0152)

## Context

Because Git versioning is opt-in (ADR-0152) and depends on system Git being installed, the AI Agent cannot rely exclusively on Git to track changes and offer rollbacks. Users must have a guaranteed, zero-dependency mechanism to review what the agent changed and undo actions with 100% confidence.

## Decision

1. **Vault-Local Change Ledger**:
   - Store agent transactions in `<vault>/.davinci/agent/history.json`.
   - Each transaction captures `transactionId`, `timestamp`, user `prompt`, and an array of `FileChangeRecord` items recording `beforeContent` and `afterContent` for creates, modifies, moves, and deletes.
   - Bound the ledger to the last 100 transactions to prevent memory or disk bloat.

2. **Inverse Rollback Computation (`computeRollbackOperations`)**:
   - Invert operations in LIFO order (reverse sequence):
     - `create` -> `delete`
     - `modify` -> restore `beforeContent`
     - `delete` -> re-create with `beforeContent`
     - `move` -> move back from destination to source

3. **Multi-Level Rollback**:
   - If Git versioning is active, also trigger `createLocalGitVersion` alongside the ledger entry, providing defense-in-depth across both systems.

## Consequences

- 100% local-first, zero-dependency undo capability.
- Full transparent change audit log accessible to the user.
- Atomic inversion prevents partial or orphaned rollback states.
