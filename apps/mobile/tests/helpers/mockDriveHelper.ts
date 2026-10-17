import { vi } from "vitest";
import type { DriveClient, DriveFile } from "@app/sync-client";
import { MobileVaultStorageAdapter } from "../../vault";
import { inMemoryFs, documentDirectory } from "../mocks/expoFileSystemMock";

export interface RemoteDriveFileEntry {
  name: string;
  content: ArrayBuffer;
  appProperties?: Record<string, string>;
}

export function createMockDriveClient(
  remoteFiles: Map<string, RemoteDriveFileEntry>,
): DriveClient {
  return {
    listAppDataFiles: vi.fn(async () => {
      const files: DriveFile[] = [];
      for (const [id, f] of remoteFiles.entries()) {
        files.push({ id, name: f.name, appProperties: f.appProperties });
      }
      return files;
    }),
    downloadFile: vi.fn(async (fileId: string) => {
      const file = remoteFiles.get(fileId);
      if (!file) throw new Error(`Not found: ${fileId}`);
      return file.content;
    }),
    findByContentHash: vi.fn(async (hash: string) => {
      for (const [id, f] of remoteFiles.entries()) {
        if (f.appProperties?.contentHash === hash) {
          return { id, name: f.name, appProperties: f.appProperties };
        }
      }
      return undefined;
    }),
    findByName: vi.fn(async (name: string) => {
      for (const [id, f] of remoteFiles.entries()) {
        if (f.name === name) {
          return { id, name: f.name, appProperties: f.appProperties };
        }
      }
      return undefined;
    }),
    uploadAppData: vi.fn(
      async (name: string, body: Blob, appProperties = {}, fileId?: string) => {
        const buffer = await body.arrayBuffer();
        const id =
          fileId ?? `remote-${Math.random().toString(36).substring(2, 9)}`;
        remoteFiles.set(id, { name, content: buffer, appProperties });
        return { id, name, appProperties };
      },
    ),
    uploadContent: vi.fn(async (item) => {
      const buffer = await item.body.arrayBuffer();
      const id = `content-${item.hash}`;
      remoteFiles.set(id, {
        name: `content/${item.hash}`,
        content: buffer,
        appProperties: { contentHash: item.hash },
      });
      return { file: { id, name: `content/${item.hash}` }, uploaded: true };
    }),
  } as unknown as DriveClient;
}

export function createDeviceAdapter(
  deviceName: string,
): MobileVaultStorageAdapter {
  const vaultPath = `${documentDirectory}${deviceName}/`;
  inMemoryFs.set(vaultPath.replace(/\/+$/, ""), {
    isDirectory: true,
    size: 0,
    mtime: Date.now(),
  });
  return new MobileVaultStorageAdapter(vaultPath, "sandbox");
}
