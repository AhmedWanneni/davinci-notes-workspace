import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getPlatformAdapters, isWebPlatformMode } from "@app/platform-adapters";

import { pickVaultFolder } from "./pickVaultFolder";
import {
  webGetFileTree,
  webListFolders,
  webListNotes,
  webOpenVault,
  webReadNote,
  webStatNote,
  webSubscribeVaultChanges,
  webWriteNote,
} from "./webVaultBridge";

export interface NoteFilePayload {
  path: string;
  content: string;
  mtime: number;
  size: number;
}

export interface NoteStatPayload {
  exists: boolean;
  mtime: number;
  size: number;
}

export interface FileTreeNode {
  name: string;
  path?: string;
  children: FileTreeNode[];
}

export interface VaultChangeBatch {
  changed: string[];
  removed: string[];
  renamed: Array<{ from: string; to: string }>;
}

export async function startVaultWatcher(): Promise<void> {
  if (isWebPlatformMode()) return;
  return invoke("start_vault_watcher");
}

export async function stopVaultWatcher(): Promise<void> {
  if (isWebPlatformMode()) {
    await getPlatformAdapters().watcher.stop();
    return;
  }
  return invoke("stop_vault_watcher");
}

export async function setVaultWatcherPaused(paused: boolean): Promise<void> {
  if (isWebPlatformMode()) {
    await getPlatformAdapters().watcher.setPaused(paused);
    return;
  }
  return invoke("set_vault_watcher_paused", { paused });
}

export async function openVault(path: string): Promise<string> {
  if (isWebPlatformMode()) {
    return webOpenVault(path);
  }
  return invoke<string>("open_vault", { path });
}

/** Pick a folder in the webview, then register it as the active vault. */
export async function openVaultFromPicker(): Promise<string> {
  const path = await pickVaultFolder();
  if (!path) {
    throw new Error("No folder selected");
  }
  return openVault(path);
}

export async function listNotes(): Promise<string[]> {
  if (isWebPlatformMode()) {
    return webListNotes();
  }
  return invoke<string[]>("list_notes");
}

export async function listFolders(): Promise<string[]> {
  if (isWebPlatformMode()) {
    return webListFolders();
  }
  return invoke<string[]>("list_folders");
}

export async function listThemeDirectories(): Promise<string[]> {
  if (isWebPlatformMode()) return [];
  return invoke<string[]>("list_theme_directories");
}

export async function listPluginDirectories(): Promise<string[]> {
  if (isWebPlatformMode()) return [];
  return invoke<string[]>("list_plugin_directories");
}

export async function readPluginFile(
  dirName: string,
  relativePath: string,
): Promise<string> {
  if (isWebPlatformMode()) {
    return getPlatformAdapters().fs.readTextFile(
      `.davinci/plugins/${dirName}/${relativePath}`,
    );
  }
  return invoke<string>("read_plugin_file", { dirName, relativePath });
}

export async function writePluginFile(
  dirName: string,
  relativePath: string,
  contents: string,
): Promise<void> {
  if (isWebPlatformMode()) {
    await getPlatformAdapters().fs.writeTextFile(
      `.davinci/plugins/${dirName}/${relativePath}`,
      contents,
    );
    return;
  }
  return invoke("write_plugin_file", { dirName, relativePath, contents });
}

export async function readThemeFile(
  dirName: string,
  relativePath: string,
): Promise<string> {
  if (isWebPlatformMode()) {
    return getPlatformAdapters().fs.readTextFile(
      `.davinci/themes/${dirName}/${relativePath}`,
    );
  }
  return invoke<string>("read_theme_file", { dirName, relativePath });
}

export async function getFileTree(): Promise<FileTreeNode[]> {
  if (isWebPlatformMode()) {
    return webGetFileTree();
  }
  return invoke<FileTreeNode[]>("get_file_tree");
}

export async function readNote(path: string): Promise<NoteFilePayload> {
  if (isWebPlatformMode()) {
    return webReadNote(path);
  }
  return invoke<NoteFilePayload>("read_note", { path });
}

export async function statNote(path: string): Promise<NoteStatPayload> {
  if (isWebPlatformMode()) {
    return webStatNote(path);
  }
  return invoke<NoteStatPayload>("stat_note", { path });
}

export async function writeNote(
  path: string,
  content: string,
): Promise<NoteStatPayload> {
  if (isWebPlatformMode()) {
    return webWriteNote(path, content);
  }
  return invoke<NoteStatPayload>("write_note", { path, content });
}

export async function renameNote(
  fromPath: string,
  toPath: string,
): Promise<void> {
  if (isWebPlatformMode()) {
    await getPlatformAdapters().fs.renameFile(fromPath, toPath);
    return;
  }
  return invoke("rename_note", { fromPath, toPath });
}

export async function deleteNote(path: string): Promise<void> {
  if (isWebPlatformMode()) {
    await getPlatformAdapters().fs.deleteFile(path);
    return;
  }
  return invoke("delete_note", { path });
}

export async function deleteFolder(path: string): Promise<void> {
  if (isWebPlatformMode()) {
    await getPlatformAdapters().fs.deleteFolder(path);
    return;
  }
  return invoke("delete_folder", { path });
}

export async function createFolder(path: string): Promise<void> {
  if (isWebPlatformMode()) {
    await getPlatformAdapters().fs.createFolder(path);
    return;
  }
  return invoke("create_folder", { path });
}

export async function renameFolder(
  fromPath: string,
  toPath: string,
): Promise<void> {
  if (isWebPlatformMode()) {
    await getPlatformAdapters().fs.renameFolder(fromPath, toPath);
    return;
  }
  return invoke("rename_folder", { fromPath, toPath });
}

export async function readBinaryFile(path: string): Promise<Uint8Array> {
  if (isWebPlatformMode()) {
    const data = await getPlatformAdapters().fs.readBinaryFile(path);
    return data instanceof Uint8Array ? data : new Uint8Array(data);
  }
  const bytes = await invoke<number[]>("read_binary_file", { path });
  return new Uint8Array(bytes);
}

export async function writeBinaryFile(
  path: string,
  data: Uint8Array | number[],
): Promise<void> {
  if (isWebPlatformMode()) {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    await getPlatformAdapters().fs.writeBinaryFile(path, bytes);
    return;
  }
  return invoke("write_binary_file", { path, data: Array.from(data) });
}

export function subscribeVaultChanges(
  handler: (batch: VaultChangeBatch) => void,
): Promise<UnlistenFn> {
  if (isWebPlatformMode()) {
    return webSubscribeVaultChanges(handler);
  }
  return listen<VaultChangeBatch>("vault-changed", (event) => {
    handler(event.payload);
  });
}
