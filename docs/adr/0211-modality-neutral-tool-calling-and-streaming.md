# ADR-0211: Modality-neutral Tool Calling Abstraction & Streaming Runtime

## Status

Accepted (extends ADR-0132)

## Context

The initial AI abstraction (ADR-0132) defined a base `complete(request: ChatRequest)` interface suited for one-shot text Q&A. The AI Agent feature requires:
1. Tool/function calling so models can inspect notes, search the index, and propose file modifications.
2. Low-latency token and tool-call streaming (`completeStream`) for real-time conversation feedback.
3. Multi-provider interoperability: Google Gemini, OpenAI-compatible cloud (OpenRouter), and local Ollama without coupling application code to vendor SDKs.

## Decision

1. **Structured Tool Schemas**:
   - Define `AgentToolDefinition`, `AgentToolCall`, and `AgentToolResult` in `@app/ai-api` using standard JSON schema property descriptors.
   - Extend `ChatMessage` to support `role: "tool"` and `toolCalls`.

2. **Zero-Dependency Streaming**:
   - Implement `parseSseStream` in `@app/ai-runtime` using native `ReadableStream` and `TextDecoder` to parse Server-Sent Events with zero external dependencies.

3. **Provider Transports**:
   - **Gemini**: Map tool definitions to `tools: [{ functionDeclarations }]`, parse `functionCall` parts from response candidates, and stream via `:streamGenerateContent?alt=sse`.
   - **OpenAI / OpenRouter**: Map to `tools: [{ type: "function" }]`, parse `tool_calls`, and stream via standard SSE chunks.
   - **Ollama**: Pass native `tools` array; simultaneously inject schema-guided instructions into the system prompt via `formatOllamaToolSystemPrompt` with JSON extraction fallback (`extractOllamaFallbackToolCall`) for models lacking native tool endpoints.

## Consequences

- All AI providers share a consistent tool calling and streaming interface.
- Zero runtime bundle overhead added (native Web streams, zero new packages).
- File sizes remain strictly within the 200–250 line constraint.
