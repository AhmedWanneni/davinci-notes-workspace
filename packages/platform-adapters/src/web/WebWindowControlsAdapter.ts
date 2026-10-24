import type { WindowControlsAdapter } from "../WindowControlsAdapter";

export class WebWindowControlsAdapter implements WindowControlsAdapter {
  readonly supported = false;

  async minimize(): Promise<void> {
    // Browser tabs are managed by the user agent
  }

  async maximize(): Promise<void> {
    await this.toggleFullscreen();
  }

  async toggleFullscreen(): Promise<void> {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    } else {
      await document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }

  async isFullscreen(): Promise<boolean> {
    if (typeof document === "undefined") return false;
    return Boolean(document.fullscreenElement);
  }

  async close(): Promise<void> {
    if (typeof window !== "undefined") {
      window.close();
    }
  }

  startDragging(): void {
    // No-op in web browser
  }
}
