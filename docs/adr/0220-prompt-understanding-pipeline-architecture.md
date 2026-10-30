# ADR-0220: Prompt Understanding Pipeline Architecture

## Status

Accepted (extends ADR-0211, ADR-0214)

## Context

Weak models (e.g. 7B/8B local LLMs) struggle with compound, messy, or vague user instructions, often hallucinating file operations or misclassifying intents. Rather than requiring fine-tuning, the agent wraps model interactions in a modular, multi-stage understanding pipeline:
1. **Rewrite Step**: Normalizes raw input into structured `{ goal, intent, target, constraints, ambiguities }`.
2. **Intent Router**: Classifies into a fixed intent set (`search_vault`, `read_note`, `create_note`, `edit_note`, `organize`, `chat`) using cheap regex/keywords first, and selects scoped prompts and tools.
3. **Constrained Actions & Confirmation Gate**: Restricts execution to valid schemas and gates destructive actions behind user confirmation.
4. **Clarification Rule**: Pauses execution and asks a single focused question when ambiguities exist.

## Decision

1. **Package Placement**:
   - Place pure understanding modules under `@app/ai-agent/understanding/` with 0 DOM dependencies.
   - Colocate pure unit tests with each pipeline step.

2. **Latency & Startup Budget**:
   - The rewrite step is skippable via options / setting (`ai.agent.rewriteEnabled`, default `true`).
   - The UI immediately enters the streaming/loading state before the rewrite call begins, ensuring instantaneous feedback.
   - The pipeline lives entirely inside `@app/ai-agent` and `LazyAgentView`, contributing 0 bytes to initial app startup.

## Consequences

- Predictable, modular decomposition of user requests.
- Weak models receive focused prompts with minimal tool surface area, drastically reducing error rates.
