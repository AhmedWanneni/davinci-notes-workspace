import { invoke } from "@tauri-apps/api/core";

export async function exportNoteToPdf(): Promise<void> {
  try {
    await invoke("print_webview");
  } catch {
    if (typeof window !== "undefined") {
      window.print();
    }
  }
}
