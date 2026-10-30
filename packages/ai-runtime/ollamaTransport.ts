import {
  AIProviderError,
  type AgentToolCall,
  type ChatRequest,
  type ChatResponse,
  type ChatStreamChunk,
  type EmbeddingRequest,
  type EmbeddingResponse,
} from "@app/ai-api";
import {
  buildOllamaChatPayload,
  extractOllamaFallbackToolCall,
  parseOllamaToolCalls,
  isToolSupportError,
  type RawOllamaToolCall,
} from "./ollamaToolFallback.js";

export interface OllamaTransportOptions {
  baseUrl?: string;
  embeddingModel?: string;
  chatModel?: string;
  fetchImpl?: typeof fetch;
}

interface OllamaBody {
  model?: string;
  embeddings?: number[][];
  message?: {
    role?: string;
    content?: string;
    tool_calls?: RawOllamaToolCall[];
  };
  done?: boolean;
}

export const DEFAULT_OLLAMA_URL = "http://localhost:11434";

export class OllamaTransport {
  private static readonly toolSupportCache = new Map<string, boolean>();
  private readonly fetchImpl: typeof fetch;
  private readonly options: Required<Omit<OllamaTransportOptions, "fetchImpl">>;

  constructor(options: OllamaTransportOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.options = {
      baseUrl: (options.baseUrl ?? DEFAULT_OLLAMA_URL).replace(/\/$/, ""),
      embeddingModel: options.embeddingModel ?? "embeddinggemma",
      chatModel: options.chatModel ?? "gemma3",
    };
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await this.fetchImpl(`${this.options.baseUrl}/api/tags`);
      if (!res.ok) return [];
      const data = (await res.json()) as { models?: Array<{ name?: string }> };
      return Array.isArray(data.models)
        ? data.models.map((m) => m.name ?? "").filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const body = await this.post("/api/embed", {
      model: this.options.embeddingModel,
      input: request.inputs,
    });
    const embeddings = (body as OllamaBody).embeddings;
    if (!embeddings) {
      throw new AIProviderError(
        "invalid-request",
        "Ollama embedding response was invalid",
      );
    }
    return {
      vectors: embeddings,
      model: (body as OllamaBody).model ?? this.options.embeddingModel,
    };
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const model = this.options.chatModel;
    const supportsNativeTools = OllamaTransport.toolSupportCache.get(model) !== false;
    const payload = buildOllamaChatPayload(request, model, false, supportsNativeTools);
    let body: OllamaBody;
    try {
      body = (await this.post("/api/chat", payload)) as OllamaBody;
      if (payload.tools) {
        OllamaTransport.toolSupportCache.set(model, true);
      }
    } catch (err) {
      if (payload.tools && isToolSupportError(err)) {
        OllamaTransport.toolSupportCache.set(model, false);
        const fallback = { ...payload };
        delete fallback.tools;
        body = (await this.post("/api/chat", fallback)) as OllamaBody;
      } else {
        throw err;
      }
    }
    const content = body.message?.content ?? "";
    let toolCalls = parseOllamaToolCalls(body.message?.tool_calls);

    if (toolCalls.length === 0 && content) {
      const fallbackCall = extractOllamaFallbackToolCall(content);
      if (fallbackCall) {
        toolCalls = [fallbackCall];
      }
    }

    if (!content && toolCalls.length === 0) {
      return {
        content: "Done.",
        model: body?.model ?? this.options.chatModel,
      };
    }

    return {
      content,
      model: body.model ?? this.options.chatModel,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  async *completeStream(request: ChatRequest): AsyncIterable<ChatStreamChunk> {
    const model = this.options.chatModel;
    const supportsNativeTools = OllamaTransport.toolSupportCache.get(model) !== false;
    const payload = buildOllamaChatPayload(request, model, true, supportsNativeTools);
    let response: Response;
    try {
      response = await this.rawPost("/api/chat", payload);
      if (payload.tools) {
        OllamaTransport.toolSupportCache.set(model, true);
      }
    } catch (err) {
      if (payload.tools && isToolSupportError(err)) {
        OllamaTransport.toolSupportCache.set(model, false);
        const fallback = { ...payload };
        delete fallback.tools;
        response = await this.rawPost("/api/chat", fallback);
      } else {
        throw err;
      }
    }
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const chunk = JSON.parse(trimmed) as OllamaBody;
            const content = chunk.message?.content;
            const toolCalls = parseOllamaToolCalls(chunk.message?.tool_calls);
            yield {
              delta: {
                content: content || undefined,
                toolCalls: toolCalls.map((tc, idx) => ({
                  index: idx,
                  id: tc.id,
                  name: tc.name,
                  argumentsDelta: JSON.stringify(tc.arguments),
                })),
              },
              finishReason: chunk.done ? "stop" : undefined,
              model: chunk.model,
            };
          } catch {
            // ignore malformed line
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private async rawPost(path: string, payload: unknown): Promise<Response> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.options.baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new AIProviderError(
        "local-server-unavailable",
        `Ollama server is unavailable at ${this.options.baseUrl}. Start Ollama or check the server address.`,
        { retryable: true, requiresReauthentication: false },
      );
    }
    if (response.ok) return response;
    const body = await response.json().catch(() => null);
    const message =
      typeof (body as { error?: unknown } | null)?.error === "string"
        ? (body as { error: string }).error
        : `Ollama request failed (${response.status})`;
    if (response.status === 404) {
      throw new AIProviderError(
        "local-server-unavailable",
        `Ollama model or endpoint was not found: ${message}`,
        { retryable: false, requiresReauthentication: false },
      );
    }
    throw new AIProviderError(
      response.status >= 500 ? "unavailable" : "invalid-request",
      message,
      { requiresReauthentication: false },
    );
  }

  private async post(path: string, payload: unknown): Promise<unknown> {
    const response = await this.rawPost(path, payload);
    return response.json().catch(() => null);
  }
}
