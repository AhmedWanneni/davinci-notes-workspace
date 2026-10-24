import type {
  FileStat,
  FileSystemAdapter,
  VaultFileEntry,
} from "../FileSystemAdapter";
import { normalizeVaultPath } from "./validateVaultPath";

interface VirtualFileNode {
  data: Uint8Array;
  mtime: number;
  blobUrl?: string;
}

export class OpfsFileSystemAdapter implements FileSystemAdapter {
  private readonly files = new Map<string, VirtualFileNode>();
  private readonly folders = new Set<string>();

  async readTextFile(path: string): Promise<string> {
    const clean = normalizeVaultPath(path);
    const bytes = await this.readBinaryFile(clean);
    return new TextDecoder().decode(bytes);
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    const clean = normalizeVaultPath(path);
    const bytes = new TextEncoder().encode(content);
    await this.writeBinaryFile(clean, bytes);
  }

  async readBinaryFile(path: string): Promise<Uint8Array> {
    const clean = normalizeVaultPath(path);
    const entry = this.files.get(clean);
    if (!entry) {
      throw new Error(`File not found in OPFS: ${clean}`);
    }
    return new Uint8Array(entry.data);
  }

  async writeBinaryFile(path: string, data: Uint8Array): Promise<void> {
    const clean = normalizeVaultPath(path);
    this.ensureParentFolders(clean);
    const existing = this.files.get(clean);
    if (existing?.blobUrl && typeof URL !== "undefined" && URL.revokeObjectURL) {
      URL.revokeObjectURL(existing.blobUrl);
    }
    this.files.set(clean, {
      data: new Uint8Array(data),
      mtime: Date.now(),
    });
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    await this.writeBinaryFile(path, data);
  }

  async deleteFile(path: string): Promise<void> {
    const clean = normalizeVaultPath(path);
    const existing = this.files.get(clean);
    if (!existing) {
      throw new Error(`File not found: ${clean}`);
    }
    if (existing.blobUrl && typeof URL !== "undefined" && URL.revokeObjectURL) {
      URL.revokeObjectURL(existing.blobUrl);
    }
    this.files.delete(clean);
  }

  async renameFile(fromPath: string, toPath: string): Promise<void> {
    const fromClean = normalizeVaultPath(fromPath);
    const toClean = normalizeVaultPath(toPath);
    const existing = this.files.get(fromClean);
    if (!existing) {
      throw new Error(`Source file not found: ${fromClean}`);
    }
    this.ensureParentFolders(toClean);
    this.files.set(toClean, {
      data: existing.data,
      mtime: Date.now(),
    });
    this.files.delete(fromClean);
  }

  async createFolder(path: string): Promise<void> {
    const clean = normalizeVaultPath(path);
    const parts = clean.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      this.folders.add(current);
    }
  }

  async mkdir(path: string): Promise<void> {
    await this.createFolder(path);
  }

  async deleteFolder(path: string): Promise<void> {
    const clean = normalizeVaultPath(path);
    const prefix = `${clean}/`;
    this.folders.delete(clean);
    for (const folder of [...this.folders]) {
      if (folder.startsWith(prefix)) {
        this.folders.delete(folder);
      }
    }
    for (const filePath of [...this.files.keys()]) {
      if (filePath.startsWith(prefix)) {
        this.files.delete(filePath);
      }
    }
  }

  async remove(path: string): Promise<void> {
    const clean = normalizeVaultPath(path);
    if (this.files.has(clean)) {
      await this.deleteFile(clean);
    } else {
      await this.deleteFolder(clean);
    }
  }

  async renameFolder(fromPath: string, toPath: string): Promise<void> {
    const fromClean = normalizeVaultPath(fromPath);
    const toClean = normalizeVaultPath(toPath);
    const prefix = `${fromClean}/`;

    if (this.folders.has(fromClean)) {
      this.folders.delete(fromClean);
      await this.createFolder(toClean);
    }

    for (const folder of [...this.folders]) {
      if (folder.startsWith(prefix)) {
        this.folders.delete(folder);
        this.folders.add(`${toClean}/${folder.slice(prefix.length)}`);
      }
    }

    for (const [filePath, node] of [...this.files.entries()]) {
      if (filePath.startsWith(prefix)) {
        this.files.delete(filePath);
        const newFilePath = `${toClean}/${filePath.slice(prefix.length)}`;
        this.ensureParentFolders(newFilePath);
        this.files.set(newFilePath, {
          data: node.data,
          mtime: Date.now(),
        });
      }
    }
  }

  async listEntries(folderPath?: string): Promise<VaultFileEntry[]> {
    const prefix = folderPath ? `${normalizeVaultPath(folderPath)}/` : "";
    const entries: VaultFileEntry[] = [];

    for (const folder of this.folders) {
      if (!prefix || folder.startsWith(prefix)) {
        entries.push({
          path: folder,
          name: folder.split("/").pop() ?? folder,
          kind: "directory",
        });
      }
    }

    for (const [filePath, node] of this.files.entries()) {
      if (!prefix || filePath.startsWith(prefix)) {
        entries.push({
          path: filePath,
          name: filePath.split("/").pop() ?? filePath,
          kind: "file",
          size: node.data.byteLength,
          mtime: node.mtime,
        });
      }
    }

    return entries;
  }

  async exists(path: string): Promise<boolean> {
    const clean = normalizeVaultPath(path);
    return this.files.has(clean) || this.folders.has(clean);
  }

  async stat(path: string): Promise<FileStat> {
    const clean = normalizeVaultPath(path);
    const file = this.files.get(clean);
    if (!file) {
      throw new Error(`Cannot stat missing file: ${clean}`);
    }
    return {
      size: file.data.byteLength,
      mtime: file.mtime,
    };
  }

  resolveFileUrl(path: string): string {
    const clean = normalizeVaultPath(path);
    const file = this.files.get(clean);
    if (!file) return path;
    if (
      !file.blobUrl &&
      typeof URL !== "undefined" &&
      typeof URL.createObjectURL === "function"
    ) {
      const blob = new Blob([file.data.buffer as ArrayBuffer]);
      file.blobUrl = URL.createObjectURL(blob);
    }
    return file.blobUrl ?? `blob:opfs/${clean}`;
  }

  private ensureParentFolders(filePath: string): void {
    const parts = filePath.split("/");
    parts.pop();
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      this.folders.add(current);
    }
  }
}
