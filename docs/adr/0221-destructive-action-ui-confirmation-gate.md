# ADR-0221: Destructive Action UI Confirmation Gate & Action Constraints

## Status

Accepted (extends ADR-0212, ADR-0213, ADR-0220)

## Context

Weak models may misinterpret vague or aggressive user instructions (e.g. "delete everything about work" or "overwrite my notes") and emit destructive tool calls. Even when a user has enabled `autoApply` for rapid note creation, executing destructive operations without interactive approval risks irreversible loss of data. Furthermore, hallucinations may produce invalid tool names outside the supported capability boundary.

## Decision

1. **Fixed Allowed Actions Schema Validation**:
   - `validateAgentAction` in `@app/ai-agent/understanding/actionValidator.ts` validates that every emitted action is within the 13 allowed tools (`read_note`, `search_vault`, `list_vault_tree`, `create_note`, `create_folder`, `create_kanban_board`, `create_database_table`, `create_todo_list`, `edit_note`, `append_to_note`, `move_note`, `delete_note`, `web_search`).
   - Unknown actions are immediately rejected with an explicit error and never forwarded to filesystem backends.

2. **Mandatory UI Confirmation for Destructive Actions**:
   - Identify destructive actions via `isDestructiveAction`: `delete_note`, `edit_note` (full content replacement), and `move_note`.
   - In `executeAgentStepTool`, when an action is destructive, `ctx.autoApply` is overridden.
   - The operation is placed into staged changes with `status: "pending"`, and the step returns `status: "confirmation_required"`, forcing the user to review and explicitly click Apply or Reject in the UI before any disk mutation occurs.

## Consequences

- 100% protection against autonomous, unprompted file deletions and file overwrites.
- Malformed and unknown tool requests fail closed.
