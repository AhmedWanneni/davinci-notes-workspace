import { Paths, File, Directory } from "expo-file-system";
import type { ManifestFile } from "@app/sync-client";
import {
  assertSafeVaultPath,
  joinVaultPaths,
  normalizeVaultPath,
  getParentFolder,
} from "./pathUtils";
import { scanVaultDirectory } from "./vaultScanner";
import type {
  NoteFilePayload,
  VaultMode,
  VaultScanResult,
  VaultStat,
  VaultStorageAdapter,
} from "./types";

async function atomicWrite(
  uri: string,
  data: string | Uint8Array,
): Promise<void> {
  const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const tempUri = `${uri}.tmp.${nonce}`;
  const tempFile = new File(tempUri);
  try {
    tempFile.write(data);
    await tempFile.move(new File(uri));
  } catch (err) {
    try {
      if (tempFile.exists) tempFile.delete();
    } catch {
      // ignore
    }
    throw err;
  }
}

export class MobileVaultStorageAdapter implements VaultStorageAdapter {
  readonly vaultUri: string;
  readonly mode: VaultMode;

  constructor(vaultUri: string, mode: VaultMode = "sandbox") {
    this.vaultUri = vaultUri.endsWith("/") ? vaultUri.slice(0, -1) : vaultUri;
    this.mode = mode;
  }

  resolveFileUri(relativePath: string): string {
    assertSafeVaultPath(relativePath);
    return joinVaultPaths(this.vaultUri, normalizeVaultPath(relativePath));
  }

  async readNote(relativePath: string): Promise<NoteFilePayload> {
    const fileUri = this.resolveFileUri(relativePath);
    const pathInfo = Paths.info(fileUri);
    if (!pathInfo.exists || pathInfo.isDirectory) {
      throw new Error(`Note not found: ${relativePath}`);
    }
    const file = new File(fileUri);
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
    const fileUri = this.resolveFileUri(relativePath);
    const parentFolder = getParentFolder(relativePath);
    if (parentFolder) {
      await this.createFolder(parentFolder);
    }
    await atomicWrite(fileUri, content);
    return this.statFile(relativePath);
  }

  async deleteNote(relativePath: string): Promise<void> {
    const fileUri = this.resolveFileUri(relativePath);
    const pathInfo = Paths.info(fileUri);
    if (pathInfo.exists) {
      if (pathInfo.isDirectory) new Directory(fileUri).delete();
      else new File(fileUri).delete();
    }
  }

  async renameNote(fromPath: string, toPath: string): Promise<void> {
    const fromUri = this.resolveFileUri(fromPath);
    const toUri = this.resolveFileUri(toPath);
    const toParent = getParentFolder(toPath);
    if (toParent) await this.createFolder(toParent);

    const info = Paths.info(fromUri);
    if (!info.exists) {
      throw new Error(`Cannot move non-existent path: ${fromPath}`);
    }
    if (info.isDirectory) {
      await new Directory(fromUri).move(new Directory(toUri));
    } else {
      await new File(fromUri).move(new File(toUri));
    }
  }

  async statFile(relativePath: string): Promise<VaultStat> {
    const fileUri = this.resolveFileUri(relativePath);
    const pathInfo = Paths.info(fileUri);
    if (!pathInfo.exists) {
      return { exists: false, mtime: 0, size: 0, isDirectory: false };
    }
    if (pathInfo.isDirectory) {
      const dirInfo = new Directory(fileUri).info();
      const mtime = dirInfo.modificationTime
        ? Math.round(dirInfo.modificationTime * 1000)
        : Date.now();
      return {
        exists: true,
        mtime,
        size: dirInfo.size ?? 0,
        isDirectory: true,
      };
    }
    const file = new File(fileUri);
    const mtime = file.lastModified ?? file.modificationTime ?? Date.now();
    return { exists: true, mtime, size: file.size ?? 0, isDirectory: false };
  }

  async createFolder(folderPath: string): Promise<void> {
    assertSafeVaultPath(folderPath);
    const dir = new Directory(this.resolveFileUri(folderPath));
    if (!dir.exists) {
      dir.create({ intermediates: true, idempotent: true });
    }
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
    const uri = path.startsWith("file://") ? path : this.resolveFileUri(path);
    return Paths.info(uri).exists;
  }

  async mkdir(path: string): Promise<void> {
    const uri = path.startsWith("file://") ? path : this.resolveFileUri(path);
    const dir = new Directory(uri);
    if (!dir.exists) {
      dir.create({ intermediates: true, idempotent: true });
    }
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    const uri = path.startsWith("file://") ? path : this.resolveFileUri(path);
    const parentFolder = getParentFolder(path);
    if (parentFolder && !path.startsWith("file://")) {
      await this.createFolder(parentFolder);
    }
    await atomicWrite(uri, data);
  }

  async readBinary(path: string): Promise<Uint8Array> {
    const uri = path.startsWith("file://") ? path : this.resolveFileUri(path);
    const file = new File(uri);
    if (!file.exists) throw new Error(`File not found: ${path}`);
    return file.bytes();
  }

  async copyFile(from: string, to: string): Promise<void> {
    const fromUri =
      from.startsWith("file://") || from.startsWith("/")
        ? from
        : this.resolveFileUri(from);
    const toUri =
      to.startsWith("file://") || to.startsWith("/")
        ? to
        : this.resolveFileUri(to);
    const toParent = getParentFolder(to);
    if (toParent && !to.startsWith("file://")) {
      await this.createFolder(toParent);
    }
    const info = Paths.info(fromUri);
    if (!info.exists) throw new Error(`Source does not exist: ${from}`);
    if (info.isDirectory) {
      await new Directory(fromUri).copy(new Directory(toUri));
    } else {
      await new File(fromUri).copy(new File(toUri));
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
      const file = new File(this.resolveFileUri(path));
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
