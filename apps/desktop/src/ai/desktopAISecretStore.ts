import type { AISecretStore } from "@app/ai-api";
import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";

/** AI keys cross only the platform secret store boundary; they are never persisted in plain web storage. */
export function createDesktopAISecretStore(): AISecretStore {
  return {
    load: (providerId) =>
      hasPlatformAdapters()
        ? getPlatformAdapters().secrets.getSecret(`ai:${providerId}`)
        : Promise.resolve(null),
    save: (providerId, apiKey) =>
      hasPlatformAdapters()
        ? getPlatformAdapters().secrets.setSecret(`ai:${providerId}`, apiKey)
        : Promise.resolve(),
    clear: (providerId) =>
      hasPlatformAdapters()
        ? getPlatformAdapters().secrets.clearSecret(`ai:${providerId}`)
        : Promise.resolve(),
  };
}
