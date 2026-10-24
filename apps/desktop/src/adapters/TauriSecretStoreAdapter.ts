import type { SecretStoreAdapter } from "@app/platform-adapters";
import { invoke } from "@tauri-apps/api/core";

export class TauriSecretStoreAdapter implements SecretStoreAdapter {
  async getSecret(key: string): Promise<string | null> {
    if (key.startsWith("ai:")) {
      const providerId = key.slice(3);
      return invoke<string | null>("load_ai_key", { providerId });
    }
    if (key === "google_calendar") {
      return invoke<string | null>("load_calendar_token");
    }
    if (key === "google_drive") {
      return invoke<string | null>("load_drive_token");
    }
    if (key.startsWith("git_pat:")) {
      const remoteUrl = key.slice(8);
      return invoke<string | null>("load_git_pat", { remoteUrl });
    }
    return null;
  }

  async setSecret(key: string, value: string): Promise<void> {
    if (key.startsWith("ai:")) {
      const providerId = key.slice(3);
      await invoke("save_ai_key", { providerId, apiKey: value });
      return;
    }
    if (key === "google_calendar") {
      await invoke("save_calendar_token", { token: value });
      return;
    }
    if (key === "google_drive") {
      await invoke("save_drive_token", { token: value });
      return;
    }
    if (key.startsWith("git_pat:")) {
      const remoteUrl = key.slice(8);
      await invoke("save_git_pat", { remoteUrl, token: value });
      return;
    }
  }

  async clearSecret(key: string): Promise<void> {
    if (key.startsWith("ai:")) {
      const providerId = key.slice(3);
      await invoke("clear_ai_key", { providerId });
      return;
    }
    if (key === "google_calendar") {
      await invoke("clear_calendar_token");
      return;
    }
    if (key === "google_drive") {
      await invoke("clear_drive_token");
      return;
    }
    if (key.startsWith("git_pat:")) {
      const remoteUrl = key.slice(8);
      await invoke("clear_git_pat", { remoteUrl });
      return;
    }
  }
}
