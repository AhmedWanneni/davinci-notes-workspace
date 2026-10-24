import type {
  FileStat,
  FileSystemAdapter,
  VaultFileEntry,
} from "../FileSystemAdapter";
import { normalizeVaultPath } from "./validateVaultPath";

export interface DirectoryHandleLike {
  name: string;
  kind?: "directory";
  getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<DirectoryHandleLike>;
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<FileHandleLike>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  entries?(): AsyncIterableIterator<[string, DirectoryHandleLike | FileHandleLike]>;
  queryPermission?(descriptor?: {
    mode?: "read" | "readwrite";
  }): Promise<PermissionState>;
  requestPermission?(descriptor?: {
    mode?: "read" | "readwrite";
  }): Promise<PermissionState>;
}

export interface FileHandleLike {
  name: string;
  kind?: "file";
  getFile(): Promise<File>;
  createWritable(): Promise<{
    write(data: Uint8Array | string): Promise<void>;
    close(): Promise<void>;
  }>;
}

export class FileSystemAccessAdapter implements FileSystemAdapter {
  private rootHandle: DirectoryHandleLike | null;

  constructor(rootHandle: DirectoryHandleLike | null = null) {
    this.rootHandle = rootHandle;
  }

  setRootHandle(handle: DirectoryHandleLike): void {
    this.rootHandle = handle;
  }

  async ensureWritePermission(): Promise<boolean> {
    if (!this.rootHandle) return false;
    if (this.rootHandle.queryPermission) {
      const state = await this.rootHandle.queryPermission({
        mode: "readwrite",
      });
      if (state === "granted") return true;
      if (this.rootHandle.requestPermission) {
        const requested = await this.rootHandle.requestPermission({
          mode: "readwrite",
        });
        return requested === "granted";
      }
      return false;
    }
    return true;
  }

  private getRoot(): DirectoryHandleLike {
    if (!this.rootHandle) {
      throw new Error(
        "FileSystemAccessAdapter has no active directory handle.",
      );
    }
    return this.rootHandle;
  }

  private async navigateToParent(
    cleanPath: string,
    create: boolean,
  ): Promise<{ dir: DirectoryHandleLike; name: string }> {
    const parts = cleanPath.split("/");
    const name = parts.pop()!;
    let current = this.getRoot();
    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create });
    }
    return { dir: current, name };
  }

  async readTextFile(path: string): Promise<string> {
    const clean = normalizeVaultPath(path);
    const { dir, name } = await this.navigateToParent(clean, false);
    const fileHandle = await dir.getFileHandle(name, { create: false });
    const file = await fileHandle.getFile();
    return file.text();
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    const clean = normalizeVaultPath(path);
    const { dir, name } = await this.navigateToParent(clean, true);
    const fileHandle = await dir.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async readBinaryFile(path: string): Promise<Uint8Array> {
    const clean = normalizeVaultPath(path);
    const { dir, name } = await this.navigateToParent(clean, false);
    const fileHandle = await dir.getFileHandle(name, { create: false });
    const file = await fileHandle.getFile();
    const buf = await file.arrayBuffer();
    return new Uint8Array(buf);
  }

  async writeBinaryFile(path: string, data: Uint8Array): Promise<void> {
    const clean = normalizeVaultPath(path);
    const { dir, name } = await this.navigateToParent(clean, true);
    const fileHandle = await dir.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    await this.writeBinaryFile(path, data);
  }

  async deleteFile(path: string): Promise<void> {
    const clean = normalizeVaultPath(path);
    const { dir, name } = await this.navigateToParent(clean, false);
    await dir.removeEntry(name, { recursive: false });
  }

  async renameFile(fromPath: string, toPath: string): Promise<void> {
    const data = await this.readBinaryFile(fromPath);
    await this.writeBinaryFile(toPath, data);
    await this.deleteFile(fromPath);
  }

  async createFolder(path: string): Promise<void> {
    const clean = normalizeVaultPath(path);
    const parts = clean.split("/");
    let current = this.getRoot();
    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create: true });
    }
  }

  async mkdir(path: string): Promise<void> {
    await this.createFolder(path);
  }

  async deleteFolder(path: string): Promise<void> {
    const clean = normalizeVaultPath(path);
    const { dir, name } = await this.navigateToParent(clean, false);
    await dir.removeEntry(name, { recursive: true });
  }

  async remove(path: string): Promise<void> {
    await this.deleteFolder(path);
  }

  async renameFolder(fromPath: string, toPath: string): Promise<void> {
    await this.createFolder(toPath);
    await this.deleteFolder(fromPath);
  }

  async listEntries(folderPath?: string): Promise<VaultFileEntry[]> {
    const root = this.getRoot();
    const results: VaultFileEntry[] = [];
    const walk = async (dir: DirectoryHandleLike, prefix: string) => {
      if (!dir.entries) return;
      for await (const [entryName, handle] of dir.entries()) {
        if (entryName.startsWith(".") || entryName === "node_modules") {
          continue;
        }
        const relPath = prefix ? `${prefix}/${entryName}` : entryName;
        if (handle.kind === "directory" || "getDirectoryHandle" in handle) {
          results.push({
            path: relPath,
            name: entryName,
            kind: "directory",
          });
          await walk(handle as DirectoryHandleLike, relPath);
        } else {
          const fh = handle as FileHandleLike;
          const file = await fh.getFile();
          results.push({
            path: relPath,
            name: entryName,
            kind: "file",
            size: file.size,
            mtime: file.lastModified,
          });
        }
      }
    };
    await walk(root, "");
    if (!folderPath) return results;
    const cleanPrefix = `${normalizeVaultPath(folderPath)}/`;
    return results.filter((e) => e.path.startsWith(cleanPrefix));
  }

  async exists(path: string): Promise<boolean> {
    try {
      const clean = normalizeVaultPath(path);
      const { dir, name } = await this.navigateToParent(clean, false);
      try {
        await dir.getFileHandle(name, { create: false });
        return true;
      } catch {
        await dir.getDirectoryHandle(name, { create: false });
        return true;
      }
    } catch {
      return false;
    }
  }

  async stat(path: string): Promise<FileStat> {
    const clean = normalizeVaultPath(path);
    const { dir, name } = await this.navigateToParent(clean, false);
    const fileHandle = await dir.getFileHandle(name, { create: false });
    const file = await fileHandle.getFile();
    return {
      size: file.size,
      mtime: file.lastModified,
    };
  }

  resolveFileUrl(path: string): string {
    return path;
  }
}
