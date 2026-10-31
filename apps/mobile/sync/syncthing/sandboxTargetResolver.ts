import * as FileSystem from "expo-file-system/legacy";
import type { SyncthingPairingPayload } from "@app/syncthing-api";

export function resolveSandboxTarget(payload: SyncthingPairingPayload): string {
  const safeName = (payload.folderLabel || payload.folderId || "Synced Vault")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .trim();
  const base = (
    FileSystem.documentDirectory || "file:///app/sandbox/documents/"
  ).replace(/\/+$/, "");
  return `${base}/vaults/${encodeURIComponent(safeName || "Vault")}`;
}

export async function createFreshSandboxFolder(
  payload: SyncthingPairingPayload,
): Promise<string> {
  const safeName = (payload.folderLabel || payload.folderId || "Synced Vault")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .trim();
  const base = (
    FileSystem.documentDirectory || "file:///app/sandbox/documents/"
  ).replace(/\/+$/, "");

  for (let n = 1; n < 100; n++) {
    const candidateName = n === 1 ? safeName : `${safeName} ${n}`;
    const candidateUri = `${base}/vaults/${encodeURIComponent(candidateName)}`;
    try {
      const info = await FileSystem.getInfoAsync(candidateUri);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(candidateUri, {
          intermediates: true,
        });
        return candidateUri;
      }
      const contents = await FileSystem.readDirectoryAsync(candidateUri).catch(
        () => [],
      );
      if (contents.length === 0) {
        return candidateUri;
      }
    } catch {
      return candidateUri;
    }
  }

  const fallback = `${base}/vaults/${encodeURIComponent(safeName)}-${Date.now().toString(36)}`;
  await FileSystem.makeDirectoryAsync(fallback, {
    intermediates: true,
  }).catch(() => {});
  return fallback;
}
