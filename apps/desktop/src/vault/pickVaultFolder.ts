import { open } from "@tauri-apps/plugin-dialog";

/** Non-blocking folder picker — must run in the webview, not Rust (avoids UI freeze). */
export async function pickVaultFolder(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: "Open vault folder",
  });

  if (selected === null) {
    return null;
  }

  return Array.isArray(selected) ? (selected[0] ?? null) : selected;
}
