import type { ExternalUrlAdapter } from "../ExternalUrlAdapter";

export class WebExternalUrlAdapter implements ExternalUrlAdapter {
  async openUrl(url: string): Promise<void> {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Invalid external URL: ${url}`);
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error(`Blocked unsafe URL protocol: ${parsed.protocol}`);
    }
    if (typeof window !== "undefined") {
      window.open(parsed.toString(), "_blank", "noopener,noreferrer");
    }
  }
}
