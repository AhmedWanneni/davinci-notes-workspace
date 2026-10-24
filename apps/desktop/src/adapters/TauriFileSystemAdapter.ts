import type {
  FileStat,
  FileSystemAdapter,
  VaultFileEntry,
} from "@app/platform-adapters";
import { convertFileSrc } from "@tauri-apps/api/core";
import { exists, mkdir, remove, writeFile } from "@tauri-apps/plugin-fs";
import {
  createFolder as invokeCreateFolder,
  deleteFolder as invokeDeleteFolder,
  deleteNote as invokeDeleteNote,
  listFolders as invokeListFolders,
  listNotes as invokeListNotes,
  readNote as invokeReadNote,
  renameFolder as invokeRenameFolder,
  renameNote as invokeRenameNote,
  statNote as invokeStatNote,
  writeBinaryFile as invokeWriteBinaryFile,
  writeNote as invokeWriteNote,
} from "../vault/vaultCommands";

export class TauriFileSystemAdapter implements FileSystemAdapter {
  async readTextFile(path: string): Promise<string> {
    const payload = await invokeReadNote(path);
    return payload.content;
  }

  async writeTextFile(path: string, content: string): Promise<void> {
    await invokeWriteNote(path, content);
  }

  async readBinaryFile(path: string): Promise<Uint8Array> {
    const { readFile } = await import("@tauri-apps/plugin-fs");
    return readFile(path);
  }

  async writeBinaryFile(path: string, data: Uint8Array): Promise<void> {
    await invokeWriteBinaryFile(path, data);
  }

  async deleteFile(path: string): Promise<void> {
    await invokeDeleteNote(path);
  }

  async renameFile(fromPath: string, toPath: string): Promise<void> {
    await invokeRenameNote(fromPath, toPath);
  }

  async createFolder(path: string): Promise<void> {
    await invokeCreateFolder(path);
  }

  async deleteFolder(path: string): Promise<void> {
    await invokeDeleteFolder(path);
  }

  async renameFolder(fromPath: string, toPath: string): Promise<void> {
    await invokeRenameFolder(fromPath, toPath);
  }

  async listEntries(_folderPath?: string): Promise<VaultFileEntry[]> {
    const [notes, folders] = await Promise.all([
      invokeListNotes(),
      invokeListFolders(),
    ]);

    const fileEntries: VaultFileEntry[] = notes.map((p) => ({
      path: p,
      name: p.split("/").pop() ?? p,
      kind: "file",
    }));

    const folderEntries: VaultFileEntry[] = folders.map((p) => ({
      path: p,
      name: p.split("/").pop() ?? p,
      kind: "directory",
    }));

    return [...folderEntries, ...fileEntries];
  }

  async exists(path: string): Promise<boolean> {
    return exists(path);
  }

  async mkdir(path: string): Promise<void> {
    await mkdir(path, { recursive: true });
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    await writeFile(path, data);
  }

  async remove(path: string): Promise<void> {
    await remove(path, { recursive: true });
  }

  resolveFileUrl(path: string): string {
    return convertFileSrc(path);
  }

  async stat(path: string): Promise<FileStat> {
    const s = await invokeStatNote(path);
    return {
      size: s.size,
      mtime: s.mtime,
    };
  }
}
