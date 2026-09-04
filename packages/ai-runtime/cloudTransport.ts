import {
  AIProviderError,
  type ChatRequest,
  type ChatResponse,
  type EmbeddingRequest,
  type EmbeddingResponse,
} from "@app/ai-api";

export interface CloudTransportOptions {
  apiKey: string;
  baseUrl?: string;
  embeddingModel?: string;
  chatModel?: string;
  fetchImpl?: typeof fetch;
}

interface EmbeddingPayload { data?: Array<{ embedding?: number[] }>; model?: string; }
interface ChatPayload { choices?: Array<{ message?: { content?: string } }>; model?: string; usage?: ChatResponse["usage"]; }

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_CHAT_MODEL = "gpt-4o-mini";

export class OpenAICompatibleTransport {
  private readonly fetchImpl: typeof fetch;
  private readonly options: Required<Pick<CloudTransportOptions, "apiKey" | "baseUrl" | "embeddingModel" | "chatModel">>;

  constructor(options: CloudTransportOptions) {
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.options = {
      apiKey: options.apiKey,
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      embeddingModel: options.embeddingModel ?? DEFAULT_EMBEDDING_MODEL,
      chatModel: options.chatModel ?? DEFAULT_CHAT_MODEL,
    };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const body = await this.post("/embeddings", {
      model: this.options.embeddingModel,
      input: request.inputs,
    });
    const payload = body as EmbeddingPayload;
    const vectors = payload.data?.map((item) => item.embedding);
    if (!vectors || vectors.some((vector) => !vector)) {
      throw new AIProviderError("invalid-request", "cloud embedding response was invalid");
    }
    return { vectors: vectors as number[][], model: payload.model ?? this.options.embeddingModel };
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const body = await this.post("/chat/completions", {
      model: this.options.chatModel,
      messages: request.messages,
      ...(request.maxTokens === undefined ? {} : { max_tokens: request.maxTokens }),
      ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
    });
    const payload = body as ChatPayload;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new AIProviderError("invalid-request", "cloud chat response was invalid");
    return { content, model: payload.model ?? this.options.chatModel, usage: payload.usage };
  }

  private async post(path: string, payload: unknown): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.options.baseUrl}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.options.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new AIProviderError("network", `cloud request failed: ${error instanceof Error ? error.message : "network error"}`);
    }
    const body = await readJson(response);
    if (response.ok) return body;
    const message = errorMessage(body) ?? `cloud request failed (${response.status})`;
    if (response.status === 401 || response.status === 403) throw new AIProviderError("authentication", message);
    if (response.status === 429) throw new AIProviderError("rate-limited", message);
    if (response.status >= 400 && response.status < 500) throw new AIProviderError("invalid-request", message, { retryable: false });
    throw new AIProviderError("unavailable", message);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { return null; }
}

function errorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const error = (body as { error?: { message?: unknown } }).error;
  return typeof error?.message === "string" ? error.message : undefined;
}
