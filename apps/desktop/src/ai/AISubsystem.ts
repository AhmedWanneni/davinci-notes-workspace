import {
  CloudAIProvider,
  LocalAIProvider,
  createGeminiProvider,
  createOllamaProvider,
  createOpenAICompatibleProvider,
  createOpenRouterProvider,
} from "@app/ai-runtime";
import type { AIProvider, AIProviderOperations } from "@app/ai-api";
import { createDesktopAISecretStore } from "./desktopAISecretStore";
import { getSetting, getVaultIndexDb, setSetting, withDbLock } from "../vault";
import { disableAllAIConsent } from "./aiConsentState";
import {
  providerValidationFailure,
  type ProviderValidationFailure,
} from "./providerValidationFailure";
export { AIConsentScreen } from "./AIConsentScreen";
export type { AIConsentScreenProps } from "./AIConsentScreen";
export { AIKeyEntryScreen } from "./AIKeyEntryScreen";
export type { AIKeyEntryScreenProps } from "./AIKeyEntryScreen";
export { AskYourVaultPanel } from "./AskYourVaultPanel";
export type { AskYourVaultPanelProps } from "./AskYourVaultPanel";
export { AISetupFlow } from "./AISetupFlow";
export type { AISetupFlowProps } from "./AISetupFlow";
export {
  loadAIConsent,
  saveAIConsent,
  disableAllAIConsent,
} from "./aiConsentState";

export type AIProviderId =
  "openai-compatible" | "gemini" | "openrouter" | "ollama";
export const AI_PROVIDER_NAMES: Record<AIProviderId, string> = {
  "openai-compatible": "OpenAI-compatible cloud",
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
  ollama: "Ollama (local server)",
};
const PROVIDER_SETTING = "ai.provider.id";
const PROVIDER_FAILURE_SETTING = "ai.provider.failure";
const PROVIDER_MODELS: Record<
  AIProviderId,
  { embeddingModel: string; chatModel: string }
> = {
  "openai-compatible": {
    embeddingModel: "text-embedding-3-small",
    chatModel: "gpt-4o-mini",
  },
  gemini: {
    embeddingModel: "gemini-embedding-001",
    chatModel: "gemini-2.0-flash",
  },
  openrouter: {
    embeddingModel: "openai/text-embedding-3-small",
    chatModel: "openai/gpt-4o-mini",
  },
  ollama: { embeddingModel: "embeddinggemma", chatModel: "gemma3" },
};
const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";

async function loadProviderSetting(key: string): Promise<string | null> {
  const db = await getVaultIndexDb();
  return withDbLock(() => getSetting(db, key));
}

export async function loadSelectedProvider(): Promise<AIProviderId> {
  const value = await loadProviderSetting(PROVIDER_SETTING);
  return value === "gemini" || value === "openrouter" || value === "ollama"
    ? value
    : "openai-compatible";
}

export async function saveSelectedProvider(
  providerId: AIProviderId,
): Promise<void> {
  const db = await getVaultIndexDb();
  await withDbLock(() => setSetting(db, PROVIDER_SETTING, providerId));
}

export async function saveOllamaConfig(
  baseUrl: string,
  embeddingModel: string,
  chatModel: string,
): Promise<void> {
  const db = await getVaultIndexDb();
  await withDbLock(async () => {
    await setSetting(db, "ai.ollama.baseUrl", baseUrl.trim());
    await setSetting(db, "ai.ollama.embeddingModel", embeddingModel.trim());
    await setSetting(db, "ai.ollama.chatModel", chatModel.trim());
  });
}

export async function loadProviderModels(providerId: AIProviderId) {
  const db = await getVaultIndexDb();
  const defaults = PROVIDER_MODELS[providerId];
  const { embeddingModel, chatModel } = await withDbLock(async () => ({
    embeddingModel: await getSetting(db, `ai.${providerId}.embeddingModel`),
    chatModel: await getSetting(db, `ai.${providerId}.chatModel`),
  }));
  return {
    embeddingModel: embeddingModel ?? defaults.embeddingModel,
    chatModel: chatModel ?? defaults.chatModel,
  };
}

export async function loadOllamaBaseUrl(): Promise<string> {
  const value = await loadProviderSetting("ai.ollama.baseUrl");
  return value ?? DEFAULT_OLLAMA_BASE_URL;
}

export async function fetchOllamaModels(baseUrl?: string): Promise<string[]> {
  try {
    const url = (baseUrl ?? (await loadOllamaBaseUrl())).replace(/\/$/, "");
    const res = await fetch(`${url}/api/tags`);
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: Array<{ name?: string }> };
    return Array.isArray(data.models)
      ? data.models.map((m) => m.name ?? "").filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export async function saveProviderModels(
  providerId: AIProviderId,
  embeddingModel: string,
  chatModel: string,
): Promise<void> {
  const db = await getVaultIndexDb();
  await withDbLock(async () => {
    await setSetting(
      db,
      `ai.${providerId}.embeddingModel`,
      embeddingModel.trim(),
    );
    await setSetting(db, `ai.${providerId}.chatModel`, chatModel.trim());
  });
}

export function createCloudProvider(operations: AIProviderOperations) {
  return new CloudAIProvider(operations);
}

export async function createStoredCloudProvider(): Promise<AIProvider> {
  const apiKey = await createDesktopAISecretStore().load("openai-compatible");
  if (!apiKey) throw new Error("cloud AI provider key is not configured");
  return createOpenAICompatibleProvider({ apiKey });
}

/** Validate only a fixed probe; vault text is never sent during key entry. */
export async function validateAndSaveCloudKey(apiKey: string): Promise<void> {
  if (!apiKey) throw new Error("provider API key is required");
  const provider = await createOpenAICompatibleProvider({ apiKey });
  try {
    await provider.embed({ inputs: ["Sophia connection test"] });
    await createDesktopAISecretStore().save("openai-compatible", apiKey);
    await saveAIProviderStatus("ready");
  } catch (error) {
    await saveAIProviderStatus("failed");
    throw error;
  } finally {
    await provider.dispose();
  }
}

export async function validateAndSaveProviderKey(
  providerId: Exclude<AIProviderId, "ollama">,
  apiKey: string,
): Promise<void> {
  if (!apiKey) throw new Error("provider API key is required");
  const models = await loadProviderModels(providerId);
  const provider =
    providerId === "gemini"
      ? await createGeminiProvider({ apiKey, ...models })
      : providerId === "openrouter"
        ? await createOpenRouterProvider({ apiKey, ...models })
        : await createOpenAICompatibleProvider({ apiKey });
  try {
    await provider.embed({ inputs: ["Sophia connection test"] });
    await createDesktopAISecretStore().save(providerId, apiKey);
    await saveAIProviderValidationStatus("ready", providerId);
  } catch (error) {
    await saveAIProviderValidationStatus(
      "failed",
      providerId,
      providerValidationFailure(error),
    );
    throw error;
  } finally {
    await provider.dispose();
  }
}

export type AIProviderStatus = "unknown" | "ready" | "failed";
export async function loadAIProviderStatus(
  providerId: AIProviderId = "openai-compatible",
): Promise<AIProviderStatus> {
  const value = await loadProviderSetting(
    providerId === "openai-compatible"
      ? "ai.provider.status"
      : `ai.provider.status.${providerId}`,
  );
  return value === "ready" || value === "failed" ? value : "unknown";
}
export async function saveAIProviderStatus(
  status: AIProviderStatus,
  providerId: AIProviderId = "openai-compatible",
): Promise<void> {
  const db = await getVaultIndexDb();
  await withDbLock(() =>
    setSetting(
      db,
      providerId === "openai-compatible"
        ? "ai.provider.status"
        : `ai.provider.status.${providerId}`,
      status,
    ),
  );
}

export async function loadAIProviderFailure(
  providerId: AIProviderId,
): Promise<ProviderValidationFailure | null> {
  const value = await loadProviderSetting(
    `${PROVIDER_FAILURE_SETTING}.${providerId}`,
  );
  return value === "authentication" ||
    value === "insufficient-credits" ||
    value === "rate-limited" ||
    value === "network" ||
    value === "unavailable" ||
    value === "invalid-request" ||
    value === "unknown"
    ? value
    : null;
}

async function saveAIProviderValidationStatus(
  status: AIProviderStatus,
  providerId: AIProviderId,
  failure: ProviderValidationFailure | null = null,
): Promise<void> {
  const db = await getVaultIndexDb();
  await withDbLock(async () => {
    await setSetting(
      db,
      providerId === "openai-compatible"
        ? "ai.provider.status"
        : `ai.provider.status.${providerId}`,
      status,
    );
    await setSetting(
      db,
      `${PROVIDER_FAILURE_SETTING}.${providerId}`,
      failure ?? "",
    );
  });
}

export async function hasStoredProviderCredential(
  providerId: AIProviderId,
): Promise<boolean> {
  if (providerId === "ollama") return true;
  try {
    return Boolean(await createDesktopAISecretStore().load(providerId));
  } catch {
    return false;
  }
}

export async function revokeCloudAI(): Promise<void> {
  await disableAllAIConsent();
  await createDesktopAISecretStore().clear("openai-compatible");
  await saveAIProviderStatus("unknown");
}

export function createLocalProvider(operations: AIProviderOperations) {
  return new LocalAIProvider(operations);
}

export async function createConfiguredProvider(
  providerId: AIProviderId,
  overrideChatModel?: string,
): Promise<AIProvider> {
  if (providerId === "ollama") {
    const db = await getVaultIndexDb();
    const { baseUrl, embeddingModel, chatModel } = await withDbLock(
      async () => ({
        baseUrl: await getSetting(db, "ai.ollama.baseUrl"),
        embeddingModel: await getSetting(db, "ai.ollama.embeddingModel"),
        chatModel: await getSetting(db, "ai.ollama.chatModel"),
      }),
    );
    return createOllamaProvider({
      baseUrl: baseUrl ?? undefined,
      embeddingModel: embeddingModel ?? undefined,
      chatModel: overrideChatModel ?? chatModel ?? undefined,
    });
  }
  const apiKey = await createDesktopAISecretStore().load(providerId);
  if (!apiKey) {
    await saveAIProviderStatus("failed", providerId);
    throw new Error(
      `${AI_PROVIDER_NAMES[providerId]} key is not configured. Reconnect it in Settings.`,
    );
  }
  const models = await loadProviderModels(providerId);
  const chatModel = overrideChatModel ?? models.chatModel;
  if (providerId === "gemini")
    return createGeminiProvider({ apiKey, ...models, chatModel });
  if (providerId === "openrouter")
    return createOpenRouterProvider({ apiKey, ...models, chatModel });
  return createOpenAICompatibleProvider({ apiKey, ...models, chatModel });
}

export async function loadEmbeddingInfrastructure() {
  return import("@app/ai-embeddings");
}

export async function createEmbeddingIndex() {
  const { EmbeddingIndex, hashText, SqliteEmbeddingStore } =
    await loadEmbeddingInfrastructure();
  const db = await getVaultIndexDb();
  return new EmbeddingIndex(hashText, new SqliteEmbeddingStore(db, withDbLock));
}
