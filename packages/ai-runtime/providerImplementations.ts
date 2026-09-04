import type { AIProvider, AIProviderOperations } from "@app/ai-api";
import type { GeminiTransport } from "./geminiTransport.js";
import type { OllamaTransportOptions } from "./ollamaTransport.js";
import type { CloudTransportOptions } from "./cloudTransport.js";

class TransportProvider implements AIProvider {
  readonly capabilities = new Set(["embeddings", "chat"] as const);
  constructor(
    readonly id: string,
    readonly mode: "cloud" | "local",
    private readonly operations: AIProviderOperations,
  ) {}
  embed(request: Parameters<AIProviderOperations["embed"]>[0]) { return this.operations.embed(request); }
  complete(request: Parameters<AIProviderOperations["complete"]>[0]) { return this.operations.complete(request); }
  async dispose(): Promise<void> { await this.operations.dispose?.(); }
}

export async function createGeminiProvider(options: ConstructorParameters<typeof GeminiTransport>[0]): Promise<AIProvider> {
  const { GeminiTransport } = await import("./geminiTransport.js");
  const transport = new GeminiTransport(options);
  return new TransportProvider("gemini", "cloud", transport);
}

export async function createOpenRouterProvider(options: CloudTransportOptions): Promise<AIProvider> {
  const { OpenAICompatibleTransport } = await import("./cloudTransport.js");
  const transport = new OpenAICompatibleTransport({ baseUrl: "https://openrouter.ai/api/v1", ...options });
  return new TransportProvider("openrouter", "cloud", transport);
}

export async function createOllamaProvider(options: OllamaTransportOptions = {}): Promise<AIProvider> {
  const { OllamaTransport } = await import("./ollamaTransport.js");
  const transport = new OllamaTransport(options);
  return new TransportProvider("ollama", "local", transport);
}
