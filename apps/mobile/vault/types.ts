import type { AttachmentFileSystem } from "@app/attachments";
import type { ManifestSource, LocalChangeApplier } from "@app/sync-client";

export type VaultMode = "sandbox" | "saf" | "custom";

export interface VaultStat {
  exists: boolean;
  mtime: number;
  size: number;
  isDirectory: boolean;
}

export interface NoteFilePayload {
  path: string;
  content: string;
  mtime: number;
  size: number;
}

export interface VaultScanResult {
  notes: string[];
  folders: string[];
  attachments: string[];
  stats: Record<string, { size: number; mtime: number }>;
}

export interface VaultChangeBatch {
  added: string[];
  changed: string[];
  removed: string[];
  renamed: Array<{ from: string; to: string }>;
}

export interface VaultInfo {
  uri: string;
  name: string;
  mode: VaultMode;
  isAccessible: boolean;
  error?: string;
}

export interface VaultStorageAdapter
  extends AttachmentFileSystem, ManifestSource, LocalChangeApplier {
  vaultUri: string;
  mode: VaultMode;

  readNote(relativePath: string): Promise<NoteFilePayload>;
  writeNote(relativePath: string, content: string): Promise<VaultStat>;
  deleteNote(relativePath: string): Promise<void>;
  renameNote(fromPath: string, toPath: string): Promise<string>;
  statFile(relativePath: string): Promise<VaultStat>;
  listNotes(): Promise<string[]>;
  listFolders(): Promise<string[]>;
  scanVault(): Promise<VaultScanResult>;
  createFolder(folderPath: string): Promise<void>;
}
