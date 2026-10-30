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

export interface CloudTransportOptions {
  apiKey: string;
  baseUrl?: string;
  embeddingModel?: string;
  chatModel?: string;
  fetchImpl?: typeof fetch;
}

interface EmbeddingPayload {
  data?: Array<{ embedding?: number[] }>;
  model?: string;
}
interface RawToolCall {
  id: string;
  type: string;
  function: { name: string; arguments: string };
}
interface ChatPayload {
  choices?: Array<{
    message?: { content?: string | null; tool_calls?: RawToolCall[] };
    finish_reason?: string;
  }>;
  model?: string;
  usage?: ChatResponse["usage"];
}

interface StreamPayload {
  choices?: Array<{
    delta?: {
      role?: "assistant";
      content?: string | null;
      tool_calls?: Array<{
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason?: string | null;
  }>;
  model?: string;
}

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_CHAT_MODEL = "gpt-4o-mini";

export class OpenAICompatibleTransport {
  private readonly fetchImpl: typeof fetch;
  private readonly options: Required<
    Pick<
      CloudTransportOptions,
      "apiKey" | "baseUrl" | "embeddingModel" | "chatModel"
    >
  >;

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
      throw new AIProviderError(
        "invalid-request",
        "cloud embedding response was invalid",
      );
    }
    return {
      vectors: vectors as number[][],
      model: payload.model ?? this.options.embeddingModel,
    };
  }

  async complete(request: ChatRequest): Promise<ChatResponse> {
    const payload = this.buildChatPayload(request, false);
    const body = (await this.post("/chat/completions", payload)) as ChatPayload;
    const choice = body.choices?.[0];
    const content = choice?.message?.content ?? "";
    const rawTools = choice?.message?.tool_calls;
    const toolCalls = parseRawToolCalls(rawTools);

    if (!content && (!toolCalls || toolCalls.length === 0)) {
      throw new AIProviderError(
        "invalid-request",
        "cloud chat response was invalid",
      );
    }
    return {
      content,
      model: body.model ?? this.options.chatModel,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      finishReason: choice?.finish_reason as ChatResponse["finishReason"],
      usage: body.usage,
    };
  }

  async *completeStream(request: ChatRequest): AsyncIterable<ChatStreamChunk> {
    const payload = this.buildChatPayload(request, true);
    const response = await this.rawPost("/chat/completions", payload);
    if (!response.body) return;

    for await (const chunkText of parseSseStream(response.body)) {
      try {
        const parsed = JSON.parse(chunkText) as StreamPayload;
        const choice = parsed.choices?.[0];
        if (!choice) continue;
        yield {
          delta: {
            role: choice.delta?.role,
            content: choice.delta?.content ?? undefined,
            toolCalls: choice.delta?.tool_calls?.map((tc) => ({
              index: tc.index,
              id: tc.id,
              name: tc.function?.name,
              argumentsDelta: tc.function?.arguments,
            })),
          },
          finishReason:
            (choice.finish_reason as ChatStreamChunk["finishReason"]) ??
            undefined,
          model: parsed.model,
        };
      } catch {
        // Ignore unparseable SSE lines
      }
    }
  }

  private buildChatPayload(request: ChatRequest, stream: boolean) {
    return {
      model: this.options.chatModel,
      messages: request.messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.toolCalls
          ? {
              tool_calls: m.toolCalls.map((tc) => ({
                id: tc.id,
                type: "function",
                function: {
                  name: tc.name,
                  arguments: JSON.stringify(tc.arguments),
                },
              })),
            }
          : {}),
        ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
        ...(m.name ? { name: m.name } : {}),
      })),
      stream,
      ...(request.tools
        ? {
            tools: request.tools.map((t) => ({
              type: "function",
              function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              },
            })),
          }
        : {}),
      ...(request.toolChoice ? { tool_choice: request.toolChoice } : {}),
      ...(request.maxTokens === undefined
        ? {}
        : { max_tokens: request.maxTokens }),
      ...(request.temperature === undefined
        ? {}
        : { temperature: request.temperature }),
    };
  }

  private async rawPost(path: string, payload: unknown): Promise<Response> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.options.baseUrl}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new AIProviderError(
        "network",
        `cloud request failed: ${error instanceof Error ? error.message : "network error"}`,
      );
    }
    if (response.ok) return response;
    const body = await response.json().catch(() => null);
    const message =
      errorMessage(body) ?? `cloud request failed (${response.status})`;
    if (response.status === 401 || response.status === 403)
      throw new AIProviderError("authentication", message);
    if (response.status === 402)
      throw new AIProviderError("insufficient-credits", message);
    if (response.status === 429)
      throw new AIProviderError("rate-limited", message);
    if (response.status >= 400 && response.status < 500)
      throw new AIProviderError("invalid-request", message, {
        retryable: false,
      });
    throw new AIProviderError("unavailable", message);
  }

  private async post(path: string, payload: unknown): Promise<unknown> {
    const response = await this.rawPost(path, payload);
    return response.json().catch(() => null);
  }
}

function parseRawToolCalls(raw?: RawToolCall[]): AgentToolCall[] {
  if (!raw) return [];
  return raw.map((item) => {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(item.function.arguments);
    } catch {
      args = {};
    }
    return { id: item.id, name: item.function.name, arguments: args };
  });
}

function errorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const error = (body as { error?: { message?: unknown } }).error;
  return typeof error?.message === "string" ? error.message : undefined;
}
