import { invoke } from "@tauri-apps/api/core";
import type { AISecretStore } from "@app/ai-api";

/** AI keys cross only the Tauri IPC/keyring boundary; they are never persisted in web storage. */
export function createDesktopAISecretStore(): AISecretStore {
  return {
    load: (providerId) => invoke<string | null>("load_ai_key", { providerId }),
    save: (providerId, apiKey) => invoke("save_ai_key", { providerId, apiKey }),
    clear: (providerId) => invoke("clear_ai_key", { providerId }),
  };
}
