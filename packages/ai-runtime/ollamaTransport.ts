import { AIProviderError, type ChatRequest, type ChatResponse, type EmbeddingRequest, type EmbeddingResponse } from "@app/ai-api";

export interface OllamaTransportOptions { baseUrl?: string; embeddingModel?: string; chatModel?: string; fetchImpl?: typeof fetch; }
interface OllamaBody { model?: string; embeddings?: number[][]; message?: { content?: string }; }

export const DEFAULT_OLLAMA_URL = "http://localhost:11434";

export class OllamaTransport {
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

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const body = await this.post("/api/embed", { model: this.options.embeddingModel, input: request.inputs });
    const embeddings = (body as OllamaBody).embeddings;
    if (!embeddings) throw new AIProviderError("invalid-request", "Ollama embedding response was invalid");
    return { vectors: embeddings, model: (body as OllamaBody).model ?? this.options.embeddingModel };
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const body = await this.post("/api/chat", { model: this.options.chatModel, messages: request.messages, stream: false });
    const content = (body as OllamaBody).message?.content;
    if (!content) throw new AIProviderError("invalid-request", "Ollama chat response was invalid");
    return { content, model: (body as OllamaBody).model ?? this.options.chatModel };
  }

  private async post(path: string, payload: unknown): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.options.baseUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } catch {
      throw new AIProviderError("local-server-unavailable", `Ollama server is unavailable at ${this.options.baseUrl}. Start Ollama or check the server address.`, { retryable: true, requiresReauthentication: false });
    }
    const body = await response.json().catch(() => null);
    if (response.ok) return body;
    const message = typeof (body as { error?: unknown } | null)?.error === "string" ? (body as { error: string }).error : `Ollama request failed (${response.status})`;
    if (response.status === 404) throw new AIProviderError("local-server-unavailable", `Ollama model or endpoint was not found: ${message}`, { retryable: false, requiresReauthentication: false });
    throw new AIProviderError(response.status >= 500 ? "unavailable" : "invalid-request", message, { requiresReauthentication: false });
  }
}
