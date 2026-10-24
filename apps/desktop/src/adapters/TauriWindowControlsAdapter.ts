import type { WindowControlsAdapter } from "@app/platform-adapters";
import { getCurrentWindow } from "@tauri-apps/api/window";

export class TauriWindowControlsAdapter implements WindowControlsAdapter {
  readonly supported = true;

  async minimize(): Promise<void> {
    await getCurrentWindow().minimize();
  }

  async maximize(): Promise<void> {
    await getCurrentWindow().toggleMaximize();
  }

  async toggleFullscreen(): Promise<void> {
    const win = getCurrentWindow();
    const isFullscreen = await win.isFullscreen();
    await win.setFullscreen(!isFullscreen);
  }

  async isFullscreen(): Promise<boolean> {
    return getCurrentWindow().isFullscreen();
  }

  async close(): Promise<void> {
    await getCurrentWindow().close();
  }

  startDragging(): void {
    void getCurrentWindow().startDragging();
  }
}
