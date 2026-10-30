# 0216. Web Search Grounding & Untrusted Content Boundaries

Date: 2026-10-25

## Context

Users want the AI Agent to answer questions that require external facts, documentation, or real-time web lookups. However:
1. Third-party web pages are completely untrusted and can contain deliberate prompt injection payloads (e.g., hidden markdown text attempting to hijack system prompts and execute destructive vault file operations).
2. Requiring an external search API key or hosted backend service would violate the app's zero-dependency, local-first architecture.
3. Adding heavy headless browsers or multi-megabyte HTML parsing packages would violate the bundle size guidelines in `PERFORMANCE.md`.

## Decision

1. **Lightweight Parser & Zero-Key Fallback**:
   Implement `webSearchTool.ts` in `@app/ai-agent` with clean HTML-to-text regex stripping for scripts, styles, and tags without bundling heavy libraries (e.g. cheerio or jsdom). Support DuckDuckGo HTML extraction as an out-of-the-box, zero-key search backend.
2. **Untrusted Envelope Boundary**:
   Wrap all web search snippets in `<untrusted_web_data source_url="...">...</untrusted_web_data>` defense envelopes, strictly escaping any closing `</untrusted_web_data>` tags within the payload.
3. **Anti-Injection Directive**:
   Enforce system boundary instructions informing the LLM that content inside `<untrusted_web_data>` is passive reference data and must never be interpreted as commands or tool overrides.

## Consequences

- Search grounding works out of the box with zero required configuration or API keys.
- Bundle weight impact is zero new runtime dependencies.
- Model cannot be hijacked into executing vault mutations via web search results.
