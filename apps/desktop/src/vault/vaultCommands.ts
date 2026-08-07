import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

import { pickVaultFolder } from "./pickVaultFolder";

export interface NoteFilePayload {
  path: string;
  content: string;
  mtime: number;
}

export interface FileTreeNode {
  name: string;
  path?: string;
  children: FileTreeNode[];
}

export interface VaultChangeBatch {
  changed: string[];
  removed: string[];
}

export async function startVaultWatcher(): Promise<void> {
  return invoke("start_vault_watcher");
}

export async function setVaultWatcherPaused(paused: boolean): Promise<void> {
  return invoke("set_vault_watcher_paused", { paused });
}

export async function openVault(path: string): Promise<string> {
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
  return invoke<string[]>("list_notes");
}

export async function getFileTree(): Promise<FileTreeNode[]> {
  return invoke<FileTreeNode[]>("get_file_tree");
}

export async function readNote(path: string): Promise<NoteFilePayload> {
  return invoke<NoteFilePayload>("read_note", { path });
}

export async function writeNote(path: string, content: string): Promise<void> {
  return invoke("write_note", { path, content });
}

export function subscribeVaultChanges(
  handler: (batch: VaultChangeBatch) => void,
): Promise<UnlistenFn> {
  return listen<VaultChangeBatch>("vault-changed", (event) => {
    handler(event.payload);
  });
}
