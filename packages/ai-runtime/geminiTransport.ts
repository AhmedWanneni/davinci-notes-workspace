import {
  AIProviderError,
  type AgentToolCall,
  type ChatRequest,
  type ChatResponse,
  type ChatStreamChunk,
  type EmbeddingRequest,
  type EmbeddingResponse,
} from "@app/ai-api";
import { parseSseStream } from "./sseStream.js";

interface GeminiOptions {
  apiKey: string;
  baseUrl?: string;
  embeddingModel?: string;
  chatModel?: string;
  fetchImpl?: typeof fetch;
}

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
}

interface GeminiCandidate {
  content?: { parts?: GeminiPart[]; role?: string };
  finishReason?: string;
}

interface GeminiBody {
  embedding?: { values?: number[] };
  candidates?: GeminiCandidate[];
}

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiTransport {
  private readonly fetchImpl: typeof fetch;
  private readonly options: Required<
    Pick<GeminiOptions, "apiKey" | "baseUrl" | "embeddingModel" | "chatModel">
  >;

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
      const body = await this.post(
        `/models/${this.options.embeddingModel}:embedContent`,
        {
          model: `models/${this.options.embeddingModel}`,
          content: { parts: [{ text: input }] },
        },
      );
      const values = (body as GeminiBody).embedding?.values;
      if (!values)
        throw new AIProviderError(
          "invalid-request",
          "Gemini embedding response was invalid",
        );
      vectors.push(values);
    }
    return { vectors, model: this.options.embeddingModel };
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const body = (await this.post(
      `/models/${this.options.chatModel}:generateContent`,
      this.buildGeminiPayload(request),
    )) as GeminiBody;

    const candidate = body.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];
    const textParts = parts
      .filter((p) => p.text)
      .map((p) => p.text!)
      .join("");
    const toolCalls: AgentToolCall[] = parts
      .filter((p) => p.functionCall)
      .map((p, idx) => ({
        id: `call_gemini_${Date.now()}_${idx}`,
        name: p.functionCall!.name,
        arguments: p.functionCall!.args ?? {},
      }));

    if (!textParts && toolCalls.length === 0) {
      throw new AIProviderError(
        "invalid-request",
        "Gemini response was invalid",
      );
    }

    return {
      content: textParts,
      model: this.options.chatModel,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: candidate?.finishReason as ChatResponse["finishReason"],
    };
  }

  async *completeStream(request: ChatRequest): AsyncIterable<ChatStreamChunk> {
    const response = await this.rawPost(
      `/models/${this.options.chatModel}:streamGenerateContent?alt=sse`,
      this.buildGeminiPayload(request),
    );
    if (!response.body) return;

    for await (const chunkText of parseSseStream(response.body)) {
      try {
        const parsed = JSON.parse(chunkText) as GeminiBody;
        const candidate = parsed.candidates?.[0];
        const parts = candidate?.content?.parts ?? [];
        const text = parts
          .filter((p) => p.text)
          .map((p) => p.text!)
          .join("");
        const toolCalls = parts
          .filter((p) => p.functionCall)
          .map((p, idx) => ({
            index: idx,
            id: `call_gemini_${Date.now()}_${idx}`,
            name: p.functionCall!.name,
            argumentsDelta: JSON.stringify(p.functionCall!.args ?? {}),
          }));

        yield {
          delta: {
            content: text || undefined,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          },
          finishReason:
            candidate?.finishReason as ChatStreamChunk["finishReason"],
          model: this.options.chatModel,
        };
      } catch {
        // Ignore unparseable SSE lines
      }
    }
  }

  private buildGeminiPayload(request: ChatRequest) {
    const contents = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => {
        if (m.role === "assistant" && m.toolCalls) {
          return {
            role: "model",
            parts: m.toolCalls.map((tc) => ({
              functionCall: { name: tc.name, args: tc.arguments },
            })),
          };
        }
        if (m.role === "tool") {
          return {
            role: "function",
            parts: [
              {
                functionResponse: {
                  name: m.name ?? "tool",
                  response: { result: m.content },
                },
              },
            ],
          };
        }
        const parts: GeminiPart[] = [{ text: m.content }];
        if (m.attachments) {
          for (const att of m.attachments) {
            if (att.data && att.mimeType.startsWith("image/")) {
              parts.push({
                inlineData: {
                  mimeType: att.mimeType,
                  data: att.data,
                },
              });
            }
          }
        }
        return {
          role: m.role === "assistant" ? "model" : "user",
          parts,
        };
      });

    const systemMessages = request.messages.filter((m) => m.role === "system");
    return {
      contents,
      ...(systemMessages.length > 0
        ? {
            systemInstruction: {
              parts: systemMessages.map((m) => ({ text: m.content })),
            },
          }
        : {}),
      ...(request.tools
        ? {
            tools: [
              {
                functionDeclarations: request.tools.map((t) => ({
                  name: t.name,
                  description: t.description,
                  parameters: t.parameters,
                })),
              },
            ],
          }
        : {}),
      generationConfig: {
        ...(request.maxTokens === undefined
          ? {}
          : { maxOutputTokens: request.maxTokens }),
        ...(request.temperature === undefined
          ? {}
          : { temperature: request.temperature }),
      },
    };
  }

  private async rawPost(path: string, payload: unknown): Promise<Response> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.options.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "x-goog-api-key": this.options.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new AIProviderError(
        "network",
        `Gemini request failed: ${error instanceof Error ? error.message : "network error"}`,
      );
    }
    if (response.ok) return response;
    const body = await response.json().catch(() => null);
    const message =
      typeof (body as { error?: { message?: unknown } } | null)?.error
        ?.message === "string"
        ? (body as { error: { message: string } }).error.message
        : `Gemini request failed (${response.status})`;
    if (response.status === 401 || response.status === 403)
      throw new AIProviderError("authentication", message);
    if (response.status === 429)
      throw new AIProviderError("rate-limited", message);
    throw new AIProviderError(
      response.status >= 500 ? "unavailable" : "invalid-request",
      message,
    );
  }

  private async post(path: string, payload: unknown): Promise<unknown> {
    const response = await this.rawPost(path, payload);
    return response.json().catch(() => null);
  }
}
