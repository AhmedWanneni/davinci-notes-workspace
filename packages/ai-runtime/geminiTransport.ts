import {
  AIProviderError,
  type ChatRequest,
  type ChatResponse,
  type EmbeddingRequest,
  type EmbeddingResponse,
} from "@app/ai-api";

interface GeminiOptions {
  apiKey: string;
  baseUrl?: string;
  embeddingModel?: string;
  chatModel?: string;
  fetchImpl?: typeof fetch;
}
interface GeminiBody {
  embedding?: { values?: number[] };
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiTransport {
  private readonly fetchImpl: typeof fetch;
  private readonly options: Required<Pick<GeminiOptions, "apiKey" | "baseUrl" | "embeddingModel" | "chatModel">>;

  constructor(options: GeminiOptions) {
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.options = {
      apiKey: options.apiKey,
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      embeddingModel: options.embeddingModel ?? "gemini-embedding-001",
      chatModel: options.chatModel ?? "gemini-2.0-flash",
    };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const vectors: number[][] = [];
    for (const input of request.inputs) {
      const body = await this.post(`/models/${this.options.embeddingModel}:embedContent`, {
        model: `models/${this.options.embeddingModel}`,
        content: { parts: [{ text: input }] },
      });
      const values = (body as GeminiBody).embedding?.values;
      if (!values) throw new AIProviderError("invalid-request", "Gemini embedding response was invalid");
      vectors.push(values);
    }
    return { vectors, model: this.options.embeddingModel };
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const body = await this.post(`/models/${this.options.chatModel}:generateContent`, {
      contents: request.messages.filter((message) => message.role !== "system").map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      ...(request.messages.some((message) => message.role === "system")
        ? { systemInstruction: { parts: request.messages.filter((message) => message.role === "system").map((message) => ({ text: message.content })) } }
        : {}),
      generationConfig: {
        ...(request.maxTokens === undefined ? {} : { maxOutputTokens: request.maxTokens }),
        ...(request.temperature === undefined ? {} : { temperature: request.temperature }),
      },
    });
    const content = (body as GeminiBody).candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
    if (!content) throw new AIProviderError("invalid-request", "Gemini response was invalid");
    return { content, model: this.options.chatModel };
  }

  private async post(path: string, payload: unknown): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.options.baseUrl}${path}`, {
        method: "POST",
        headers: { "x-goog-api-key": this.options.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new AIProviderError("network", `Gemini request failed: ${error instanceof Error ? error.message : "network error"}`);
    }
    const body = await response.json().catch(() => null);
    if (response.ok) return body;
    const message = typeof (body as { error?: { message?: unknown } } | null)?.error?.message === "string"
      ? (body as { error: { message: string } }).error.message : `Gemini request failed (${response.status})`;
    if (response.status === 401 || response.status === 403) throw new AIProviderError("authentication", message);
    if (response.status === 429) throw new AIProviderError("rate-limited", message);
    throw new AIProviderError(response.status >= 500 ? "unavailable" : "invalid-request", message);
  }
}
