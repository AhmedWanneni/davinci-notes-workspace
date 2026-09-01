import { invoke } from "@tauri-apps/api/core";
import type { ManifestFile, ManifestSource } from "@app/sync-client";

interface NativeManifestFile {
  path: string;
  size: number;
  mtimeMs: number;
}

export function createDesktopManifestSource(): ManifestSource {
  return {
    async listFiles(): Promise<readonly ManifestFile[]> {
      return invoke<NativeManifestFile[]>("list_manifest_files");
    },
    hashFile(path: string): Promise<string> {
      return invoke<string>("hash_manifest_file", { path });
    },
  };
}
