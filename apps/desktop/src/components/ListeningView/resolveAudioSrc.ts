import { convertFileSrc } from "@tauri-apps/api/core";

export function resolveAudioSrc(
  vaultPath?: string | null,
  audioFileName?: string | null,
): string | null {
  if (!audioFileName || !vaultPath) return null;
  if (
    audioFileName.startsWith("http://") ||
    audioFileName.startsWith("https://") ||
    audioFileName.startsWith("asset://")
  ) {
    return audioFileName;
  }
  const cleanName = audioFileName.replace(/^attachments[/\\]/, "");
  const fullPath = `${vaultPath.replace(/[/\\]+$/, "")}/attachments/${cleanName}`;
  try {
    return convertFileSrc(fullPath);
  } catch {
    return `asset://localhost/${encodeURIComponent(fullPath)}`;
  }
}
