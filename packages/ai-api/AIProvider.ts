import type {
  AgentToolCall,
  AgentToolDefinition,
  ChatStreamChunk,
} from "./agentTypes.js";

export type AIProviderMode = "cloud" | "local";
export type AIProviderCapability =
  "embeddings" | "chat" | "tools" | "streaming";

export interface EmbeddingRequest {
  inputs: string[];
}

export interface EmbeddingResponse {
  vectors: number[][];
  model: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  url?: string;
  data?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  attachments?: ChatAttachment[];
  toolCalls?: AgentToolCall[];
  toolCallId?: string;
  name?: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  tools?: AgentToolDefinition[];
  toolChoice?: "auto" | "none" | "required";
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  toolCalls?: AgentToolCall[];
  finishReason?: "stop" | "tool_calls" | "length" | "content_filter" | "error";
  usage?: { inputTokens?: number; outputTokens?: number };
}

export type AIProviderErrorCode =
  | "authentication"
  | "insufficient-credits"
  | "rate-limited"
  | "network"
  | "unavailable"
  | "invalid-request"
  | "local-server-unavailable";

export class AIProviderError extends Error {
  readonly code: AIProviderErrorCode;
  readonly retryable: boolean;
  readonly requiresReauthentication: boolean;

  constructor(
    code: AIProviderErrorCode,
    message: string,
    options: { retryable?: boolean; requiresReauthentication?: boolean } = {},
  ) {
    super(message);
    this.name = "AIProviderError";
    this.code = code;
    this.retryable =
      options.retryable ??
      (code === "network" ||
        code === "rate-limited" ||
        code === "insufficient-credits");
    this.requiresReauthentication =
      options.requiresReauthentication ?? code === "authentication";
  }
}

export interface AIProvider {
  readonly id: string;
  readonly mode: AIProviderMode;
  readonly capabilities: ReadonlySet<AIProviderCapability>;
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  complete(request: ChatRequest): Promise<ChatResponse>;
  completeStream?(request: ChatRequest): AsyncIterable<ChatStreamChunk>;
  dispose(): Promise<void>;
}

export interface AIProviderOperations {
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  complete(request: ChatRequest): Promise<ChatResponse>;
  completeStream?(request: ChatRequest): AsyncIterable<ChatStreamChunk>;
  dispose?(): Promise<void>;
}

export interface AISecretStore {
  load(providerId: string): Promise<string | null>;
  save(providerId: string, apiKey: string): Promise<void>;
  clear(providerId: string): Promise<void>;
}
