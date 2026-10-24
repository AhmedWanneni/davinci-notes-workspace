import type { ExternalUrlAdapter } from "@app/platform-adapters";
import { invoke } from "@tauri-apps/api/core";

export class TauriExternalUrlAdapter implements ExternalUrlAdapter {
  async openUrl(url: string): Promise<void> {
    await invoke("open_external_url", { url });
  }
}
