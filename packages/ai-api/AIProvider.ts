export type AIProviderMode = "cloud" | "local";
export type AIProviderCapability = "embeddings" | "chat";

export interface EmbeddingRequest {
  inputs: string[];
}

export interface EmbeddingResponse {
  vectors: number[][];
  model: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage?: { inputTokens?: number; outputTokens?: number };
}

export type AIProviderErrorCode =
  | "authentication"
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
    this.retryable = options.retryable ?? (code === "network" || code === "rate-limited");
    this.requiresReauthentication = options.requiresReauthentication ?? code === "authentication";
  }
}

export interface AIProvider {
  readonly id: string;
  readonly mode: AIProviderMode;
  readonly capabilities: ReadonlySet<AIProviderCapability>;
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  complete(request: ChatRequest): Promise<ChatResponse>;
  dispose(): Promise<void>;
}

export interface AIProviderOperations {
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  complete(request: ChatRequest): Promise<ChatResponse>;
  dispose?(): Promise<void>;
}

export interface AISecretStore {
  load(providerId: string): Promise<string | null>;
  save(providerId: string, apiKey: string): Promise<void>;
  clear(providerId: string): Promise<void>;
}
