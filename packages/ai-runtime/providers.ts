import type {
  AIProvider,
  AIProviderCapability,
  AIProviderMode,
  AIProviderOperations,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
} from "@app/ai-api";
import { OpenAICompatibleTransport, type CloudTransportOptions } from "./cloudTransport.js";

abstract class DelegatingAIProvider implements AIProvider {
  abstract readonly id: string;
  abstract readonly mode: AIProviderMode;
  readonly capabilities: ReadonlySet<AIProviderCapability> = new Set(["embeddings", "chat"]);

  constructor(private readonly operations: AIProviderOperations) {}
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse> { return this.operations.embed(request); }
  complete(request: ChatRequest): Promise<ChatResponse> { return this.operations.complete(request); }
  async dispose(): Promise<void> { await this.operations.dispose?.(); }
}

export class CloudAIProvider extends DelegatingAIProvider {
  readonly id = "cloud";
  readonly mode = "cloud" as const;
  constructor(options: CloudTransportOptions);
  constructor(operations: AIProviderOperations);
  constructor(value: CloudTransportOptions | AIProviderOperations) {
    super("apiKey" in value ? new OpenAICompatibleTransport(value) : value);
  }
}

export class LocalAIProvider extends DelegatingAIProvider {
  readonly id = "local";
  readonly mode = "local" as const;
}
