import { Directory, File, Paths } from "expo-file-system";
import type { ManifestFile } from "@app/sync-client";
import {
  assertSafeVaultPath,
  normalizeToValidFileUri,
  normalizeVaultPath,
} from "./pathUtils";
import { scanVaultDirectory } from "./vaultScanner";
import {
  atomicWriteEntry,
  disambiguatePath,
  ensureDirectory,
  moveEntry,
  resolveEntry,
  resolveExisting,
} from "./fs/vaultEntries";
import { defaultNoteStore } from "./noteStore";
import type {
  NoteFilePayload,
  VaultMode,
  VaultScanResult,
  VaultStat,
  VaultStorageAdapter,
} from "./types";

export class MobileVaultStorageAdapter implements VaultStorageAdapter {
  readonly vaultUri: string;
  readonly mode: VaultMode;
  readonly rootDirectory: Directory;

  constructor(vaultUri: string, mode: VaultMode = "sandbox") {
    const normalized = normalizeToValidFileUri(vaultUri);
    this.vaultUri = normalized.endsWith("/")
      ? normalized.slice(0, -1)
      : normalized;
    this.mode = mode;
    this.rootDirectory = new Directory(this.vaultUri);
  }

  resolveFileUri(relativePath: string): string {
    assertSafeVaultPath(relativePath);
    const resolved = resolveEntry(this.rootDirectory, relativePath, "file");
    return resolved
      ? resolved.uri
      : `${this.vaultUri}/${normalizeVaultPath(relativePath)}`;
  }

  async readNote(relativePath: string): Promise<NoteFilePayload> {
    assertSafeVaultPath(relativePath);
    const file = resolveEntry(this.rootDirectory, relativePath, "file");
    if (!(file instanceof File) || !file.exists) {
      throw new Error(`Note not found: ${relativePath}`);
    }
    const content = await file.text();
    const mtime = file.lastModified ?? file.modificationTime ?? Date.now();
    return {
      path: normalizeVaultPath(relativePath),
      content,
      mtime,
      size: file.size ?? content.length,
    };
  }

  async writeNote(relativePath: string, content: string): Promise<VaultStat> {
    assertSafeVaultPath(relativePath);
    await atomicWriteEntry(this.rootDirectory, relativePath, content);
    return this.statFile(relativePath);
  }

  async deleteNote(relativePath: string): Promise<void> {
    assertSafeVaultPath(relativePath);
    const existing = resolveExisting(this.rootDirectory, relativePath);
    if (existing && existing.exists) {
      existing.delete();
    }
  }

  async renameNote(fromPath: string, toPath: string): Promise<string> {
    assertSafeVaultPath(fromPath);
    assertSafeVaultPath(toPath);
    const normFrom = normalizeVaultPath(fromPath);
    const normTo = normalizeVaultPath(toPath);

    if (normFrom === normTo) {
      return normTo;
    }

    const source = resolveExisting(this.rootDirectory, normFrom);
    if (!source || !source.exists) {
      throw new Error(`Source note does not exist: ${normFrom}`);
    }

    const targetPath = disambiguatePath(this.rootDirectory, normTo);
    await moveEntry(this.rootDirectory, normFrom, targetPath);
    defaultNoteStore.rename(normFrom, targetPath);
    return targetPath;
  }

  async statFile(relativePath: string): Promise<VaultStat> {
    assertSafeVaultPath(relativePath);
    const existing = resolveExisting(this.rootDirectory, relativePath);
    if (!existing || !existing.exists) {
      return { exists: false, mtime: 0, size: 0, isDirectory: false };
    }
    const isDir = existing instanceof Directory;
    const mtime = isDir
      ? Date.now()
      : ((existing as File).lastModified ??
        (existing as File).modificationTime ??
        Date.now());
    const size = isDir ? 0 : ((existing as File).size ?? 0);
    return {
      exists: true,
      mtime,
      size,
      isDirectory: isDir,
    };
  }

  async createFolder(folderPath: string): Promise<void> {
    assertSafeVaultPath(folderPath);
    ensureDirectory(this.rootDirectory, folderPath);
  }

  async listNotes(): Promise<string[]> {
    return (await this.scanVault()).notes;
  }

  async listFolders(): Promise<string[]> {
    return (await this.scanVault()).folders;
  }

  async scanVault(): Promise<VaultScanResult> {
    return scanVaultDirectory(this.vaultUri);
  }

  // --- AttachmentFileSystem Seam (@app/attachments) ---

  async exists(path: string): Promise<boolean> {
    if (path.startsWith("file://") || path.startsWith("content://")) {
      return Paths.info(path).exists;
    }
    const stat = await this.statFile(path);
    return stat.exists;
  }

  async mkdir(path: string): Promise<void> {
    if (path.startsWith("file://") || path.startsWith("content://")) {
      const dir = new Directory(path);
      if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
      return;
    }
    await this.createFolder(path);
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    if (path.startsWith("file://") || path.startsWith("content://")) {
      const file = new File(path);
      file.write(data);
      return;
    }
    await atomicWriteEntry(this.rootDirectory, path, data);
  }

  async readBinary(path: string): Promise<Uint8Array> {
    if (path.startsWith("file://") || path.startsWith("content://")) {
      const file = new File(path);
      if (!file.exists) throw new Error(`File not found: ${path}`);
      return file.bytes();
    }
    const file = resolveEntry(this.rootDirectory, path, "file");
    if (!(file instanceof File) || !file.exists) {
      throw new Error(`File not found: ${path}`);
    }
    return file.bytes();
  }

  async copyFile(from: string, to: string): Promise<void> {
    let sourceFile: File;
    if (from.startsWith("file://") || from.startsWith("content://")) {
      sourceFile = new File(from);
    } else {
      const entry = resolveEntry(this.rootDirectory, from, "file");
      if (!(entry instanceof File) || !entry.exists) {
        throw new Error(`Source does not exist: ${from}`);
      }
      sourceFile = entry;
    }
    if (!sourceFile.exists) throw new Error(`Source does not exist: ${from}`);

    const bytes = await sourceFile.bytes();
    if (to.startsWith("file://") || to.startsWith("content://")) {
      const targetFile = new File(to);
      targetFile.write(bytes);
    } else {
      await atomicWriteEntry(this.rootDirectory, to, bytes);
    }
  }

  // --- ManifestSource & LocalChangeApplier Seam (@app/sync-client) ---

  async listFiles(): Promise<readonly ManifestFile[]> {
    const scan = await this.scanVault();
    const all = [...scan.notes, ...scan.attachments];
    return all.map((path) => ({
      path,
      size: scan.stats[path]?.size ?? 0,
      mtimeMs: scan.stats[path]?.mtime ?? 0,
    }));
  }

  async hashFile(path: string): Promise<string> {
    try {
      const file = resolveEntry(this.rootDirectory, path, "file");
      if (!(file instanceof File) || !file.exists) {
        return "0";
      }
      const bytes = await file.bytes();
      const buffer = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      const stat = await this.statFile(path);
      if (!stat.exists) return "0";
      return `hash-${path}-${stat.size}-${stat.mtime}`;
    }
  }

  async write(path: string, content: ArrayBuffer): Promise<void> {
    await this.writeFile(path, new Uint8Array(content));
  }

  async remove(path: string): Promise<void> {
    await this.deleteNote(path);
  }
}
