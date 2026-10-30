# ADR-0219: Zero-Dependency Schema Validator for Prompt Understanding

## Status

Accepted (extends ADR-0132, ADR-0211)

## Context

The prompt understanding pipeline requires validating structured LLM outputs (`{ goal, intent, target, constraints, ambiguities }`) against a schema. If the model returns malformed JSON or schema breaches, the pipeline must retry once and gracefully fall back to the raw prompt without crashing.

`zod` is not installed anywhere in the repository. Adding `zod` would introduce ~14 KB minified/gzip (~55 KB raw) to the bundle. `PERFORMANCE.md` Hard Rule 1 states: "Never add a heavy library for a small convenience — implement it directly if it's simple."

## Decision

1. **Lightweight Pure-TypeScript Validator**:
   - Implement `validateStructuredUserRequest` in `@app/ai-agent/understanding/rewriteSchema.ts` with 0 external dependencies.
   - Enforce exact types: non-empty string `goal`, string `intent`, nullable trimmed `target`, array of strings for `constraints` and `ambiguities`.
   - Provide standard `{ success: true, data } | { success: false, error }` discriminator matching the zod contract.

2. **Retry and Fallback Contract**:
   - `executeRewriteStep` calls the model with `REWRITE_SYSTEM_PROMPT`.
   - On parse or schema failure, logs the error and retries once with `REWRITE_RETRY_PROMPT` containing the validation error.
   - On second failure or exception, safely returns a fallback object wrapping the raw user message with `intent: "chat"`, guaranteeing zero crashes.

## Consequences

- Zero KB added to bundle or external dependencies.
- Strict type-safety and 100% test coverage with zero runtime overhead.
