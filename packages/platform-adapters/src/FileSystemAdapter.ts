export interface VaultFileEntry {
  path: string;
  name: string;
  kind: "file" | "directory";
  size?: number;
  mtime?: number;
}

export interface FileStat {
  size: number;
  mtime: number;
}

export interface FileSystemAdapter {
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, content: string): Promise<void>;
  readBinaryFile(path: string): Promise<Uint8Array>;
  writeBinaryFile(path: string, data: Uint8Array): Promise<void>;
  deleteFile(path: string): Promise<void>;
  renameFile(fromPath: string, toPath: string): Promise<void>;
  createFolder(path: string): Promise<void>;
  deleteFolder(path: string): Promise<void>;
  renameFolder(fromPath: string, toPath: string): Promise<void>;
  listEntries(folderPath?: string): Promise<VaultFileEntry[]>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  remove(path: string): Promise<void>;
  resolveFileUrl(path: string): string;
  stat(path: string): Promise<FileStat>;
}
