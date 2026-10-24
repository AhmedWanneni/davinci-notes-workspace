import type { FileSystemAdapter } from "@app/platform-adapters";

export interface VaultArchiveFileEntry {
  readonly path: string;
  readonly base64: string;
  readonly mtimeMs: number;
}

export interface VaultArchivePayload {
  readonly format: "davinci-vault-archive-v1";
  readonly exportedAtMs: number;
  readonly files: readonly VaultArchiveFileEntry[];
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const vaultArchive = {
  async exportVaultArchive(
    fs: FileSystemAdapter,
    vaultRoot?: string
  ): Promise<Uint8Array> {
    const cleanRoot = vaultRoot ? vaultRoot.replace(/^\/+|\/+$/g, "") : "";
    const entries = await fs.listEntries(cleanRoot || undefined);
    const fileEntries = entries
      .filter((entry) => entry.kind === "file")
      .sort((a, b) => a.path.localeCompare(b.path));

    const prefix = cleanRoot ? `${cleanRoot}/` : "";
    const archiveFiles: VaultArchiveFileEntry[] = [];

    for (const entry of fileEntries) {
      const relativePath =
        prefix && entry.path.startsWith(prefix)
          ? entry.path.slice(prefix.length)
          : entry.path;
      const raw = await fs.readBinaryFile(entry.path);
      archiveFiles.push({
        path: relativePath,
        base64: bytesToBase64(raw),
        mtimeMs: entry.mtime ?? Date.now(),
      });
    }

    const payload: VaultArchivePayload = {
      format: "davinci-vault-archive-v1",
      exportedAtMs: Date.now(),
      files: archiveFiles,
    };

    return new TextEncoder().encode(JSON.stringify(payload));
  },

  async importVaultArchive(
    archiveBytes: Uint8Array,
    fs: FileSystemAdapter,
    vaultRoot?: string
  ): Promise<{ importedCount: number; paths: string[] }> {
    const json = new TextDecoder().decode(archiveBytes);
    const parsed = JSON.parse(json) as VaultArchivePayload;
    if (
      parsed.format !== "davinci-vault-archive-v1" ||
      !Array.isArray(parsed.files)
    ) {
      throw new Error("Invalid vault archive format.");
    }

    const cleanRoot = vaultRoot ? vaultRoot.replace(/^\/+|\/+$/g, "") : "";
    const importedPaths: string[] = [];

    for (const file of parsed.files) {
      const cleanRel = file.path.replace(/^\/+/, "");
      const fullPath = cleanRoot ? `${cleanRoot}/${cleanRel}` : cleanRel;
      const bytes = base64ToBytes(file.base64);
      await fs.writeBinaryFile(fullPath, bytes);
      importedPaths.push(cleanRel);
    }

    return {
      importedCount: importedPaths.length,
      paths: importedPaths,
    };
  },
};
