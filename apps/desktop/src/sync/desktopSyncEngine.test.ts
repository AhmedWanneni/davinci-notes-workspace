import { beforeEach, describe, expect, it, vi } from "vitest";
import { runDesktopDriveSync } from "./desktopSyncEngine";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import type { DriveClient, DriveFile } from "@app/sync-client";

vi.mock("../vault/vaultCommands", () => ({
  deleteNote: vi.fn(),
  listFolders: vi.fn(async () => []),
  listNotes: vi.fn(async () => ["note1.md"]),
  readNote: vi.fn(async (path: string) => ({
    path,
    content: "# Local Content",
    mtime: 1000,
    size: 15,
  })),
  setVaultWatcherPaused: vi.fn(),
  writeBinaryFile: vi.fn(),
  writeNote: vi.fn(),
}));

vi.mock("./desktopManifestSource", () => ({
  createDesktopManifestSource: () => ({
    listFiles: async () => [{ path: "note1.md", size: 15, mtimeMs: 1000 }],
    hashFile: async () => "hash123",
  }),
}));

vi.mock("./desktopManifestStorage", () => {
  let stored: string | undefined = undefined;
  return {
    DesktopManifestStorage: class {
      async read() {
        return stored;
      }
      async write(val: string) {
        stored = val;
      }
    },
  };
});

describe("desktopSyncEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.setState({ vaultPath: null });
  });

  it("fails early when no vault is open", async () => {
    const res = await runDesktopDriveSync();
    expect(res.success).toBe(false);
    expect(res.error).toBe("No vault open");
  });

  it("runs sync pass successfully pushing local notes", async () => {
    useWorkspaceStore.setState({ vaultPath: "/Users/test/vault" });

    const uploadedFiles: Array<{ name: string; body: Blob }> = [];
    const mockDrive = {
      listFiles: vi.fn(async () => [] as DriveFile[]),
      createFile: vi.fn(async (meta: { name: string }) => ({ id: "folder-1", name: meta.name })),
      uploadFileMultipart: vi.fn(async (opts: { name: string }) => ({ id: "file-1", name: opts.name })),
      uploadFileMedia: vi.fn(async (id: string) => ({ id, name: "file" })),
      deleteFile: vi.fn(async () => {}),
      listAppDataFiles: vi.fn(async () => [] as DriveFile[]),
      findByName: vi.fn(async () => undefined),
      findByContentHash: vi.fn(async () => undefined),
      downloadFile: vi.fn(async () => new ArrayBuffer(0)),
      uploadContent: vi.fn(async (upload: { name: string; body: Blob }) => {
        uploadedFiles.push(upload);
        return { file: { id: "f1", name: upload.name }, uploaded: true };
      }),
      uploadAppData: vi.fn(async (name: string, body: Blob) => {
        uploadedFiles.push({ name, body });
        return { id: "m1", name };
      }),
    } as unknown as DriveClient;

    const res = await runDesktopDriveSync({ mockDriveClient: mockDrive });
    expect(res.success).toBe(true);
    expect(res.pushedCount).toBe(1);
    expect(mockDrive.uploadContent).toHaveBeenCalled();
    expect(mockDrive.uploadAppData).toHaveBeenCalled();
  });

  it("skips push when drive file contentHash matches local file", async () => {
    useWorkspaceStore.setState({ vaultPath: "/Users/test/vault" });

    const mockDrive = {
      listFiles: vi.fn(async () => [
        {
          id: "drive-note-1",
          name: "note1.md",
          appProperties: { davinciVault: "folder-1", vaultPath: "note1.md", contentHash: "hash123" },
        },
      ] as DriveFile[]),
      createFile: vi.fn(async (meta: { name: string }) => ({ id: "folder-1", name: meta.name })),
      uploadFileMultipart: vi.fn(),
      uploadFileMedia: vi.fn(),
      deleteFile: vi.fn(),
      listAppDataFiles: vi.fn(async () => [] as DriveFile[]),
      findByName: vi.fn(async () => undefined),
      uploadAppData: vi.fn(async (name: string) => ({ id: "m1", name })),
      uploadContent: vi.fn(),
    } as unknown as DriveClient;

    const res = await runDesktopDriveSync({ mockDriveClient: mockDrive });
    expect(res.success).toBe(true);
    expect(res.pushedCount).toBe(0);
    expect(mockDrive.uploadFileMultipart).not.toHaveBeenCalled();
  });

  it("pulls files when Drive has files not yet present locally", async () => {
    useWorkspaceStore.setState({ vaultPath: "/Users/test/vault" });

    const mockDrive = {
      listFiles: vi.fn(async () => [
        {
          id: "drive-note-1",
          name: "note1.md",
          appProperties: { davinciVault: "folder-1", vaultPath: "note1.md", contentHash: "hash123" },
        },
        {
          id: "drive-remote-2",
          name: "from-mobile.md",
          appProperties: { davinciVault: "folder-1", vaultPath: "from-mobile.md", contentHash: "hash-mobile" },
        },
      ] as DriveFile[]),
      createFile: vi.fn(async (meta: { name: string }) => ({ id: "folder-1", name: meta.name })),
      uploadFileMultipart: vi.fn(),
      uploadFileMedia: vi.fn(),
      deleteFile: vi.fn(),
      listAppDataFiles: vi.fn(async () => [] as DriveFile[]),
      findByName: vi.fn(async () => undefined),
      downloadFile: vi.fn(async () => new TextEncoder().encode("# From Mobile").buffer),
      uploadAppData: vi.fn(async (name: string) => ({ id: "m1", name })),
      uploadContent: vi.fn(),
    } as unknown as DriveClient;

    const res = await runDesktopDriveSync({ mockDriveClient: mockDrive });
    expect(res.success).toBe(true);
    expect(res.pulledCount).toBe(1);
    expect(mockDrive.downloadFile).toHaveBeenCalledWith("drive-remote-2");
  });
});
