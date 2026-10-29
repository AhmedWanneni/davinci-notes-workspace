# ADR-0222: Scoped Intent Prompts and Tool Gating

## Status

Accepted (extends ADR-0211, ADR-0220)

## Context

Supplying a monolithic system prompt with the full catalog of all 15+ vault tools to a weak model causes severe cognitive overload, leading to hallucinated file creations during simple search requests, permission confusion, and malformed parameter calls.

## Decision

1. **Fixed Intent Hierarchy**:
   - Classify user requests into 6 scoped intents: `search_vault`, `read_note`, `create_note`, `edit_note`, `organize`, and `chat`.
   - Use high-speed regex/keyword heuristics (`classifyIntentFast`) first to resolve obvious intents with 0 model calls and 0 ms added latency.
   - For ambiguous cases, invoke a concise classification prompt (`INTENT_MODEL_PROMPT`).

2. **Isolated Per-Intent System Prompts**:
   - Each intent is defined in its own modular file (`packages/ai-agent/prompts/`), keeping prompt templates under 50 lines.
   - Prompts strictly define the behavioral scope for that intent.

3. **Strict Tool Gating**:
   - Only tools relevant to the classified intent are exposed:
     - `search_vault`: `search_vault`, `list_vault_tree`
     - `read_note`: `read_note`, `search_vault`
     - `create_note`: `create_note`, `create_folder`, `create_kanban_board`, `create_database_table`, `create_todo_list`
     - `edit_note`: `read_note`, `edit_note`, `append_to_note`
     - `organize`: `list_vault_tree`, `move_note`, `create_folder`, `read_note`
     - `chat`: No tools (pure conversation)

## Consequences

- The model's context payload is reduced by >60%.
- Destructive and mutation tools are completely inaccessible when searching or chatting, eliminating accidental writes.
