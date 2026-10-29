// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { setPlatformAdapters } from "@app/platform-adapters";
import { useEditorMediaHandlers } from "./useEditorMediaHandlers";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import * as vaultModule from "../../vault";

describe("useEditorMediaHandlers", () => {
  const mockResolveFileUrl = vi.fn(
    (path: string) => `asset://localhost${path}`,
  );

  beforeEach(() => {
    vi.restoreAllMocks();
    useWorkspaceStore.setState({
      vaultPath: "/test/vault",
      allFolderPaths: [],
      allNotePaths: [],
      attachmentSettings: {
        locationMode: "vault-root",
        specifiedFolder: "attachments",
        noteSubfolder: "attachments",
      },
    });

    setPlatformAdapters({
      fs: {
        resolveFileUrl: mockResolveFileUrl,
        readTextFile: vi.fn(),
        writeTextFile: vi.fn(),
        readBinaryFile: vi.fn(),
        writeBinaryFile: vi.fn(),
        deleteFile: vi.fn(),
        renameFile: vi.fn(),
        createFolder: vi.fn(),
        deleteFolder: vi.fn(),
        renameFolder: vi.fn(),
        listEntries: vi.fn(),
        exists: vi.fn(),
        mkdir: vi.fn(),
        writeFile: vi.fn(),
        remove: vi.fn(),
        stat: vi.fn(),
      },
    } as Parameters<typeof setPlatformAdapters>[0]);
  });

  it("creates images folder when missing and writes image file there", async () => {
    const createFolderSpy = vi
      .spyOn(vaultModule, "createFolder")
      .mockResolvedValue(undefined);
    const writeAttachmentSpy = vi
      .spyOn(vaultModule, "writeAttachmentToVault")
      .mockResolvedValue("/test/vault/images/screenshot.png");

    const { result } = renderHook(() =>
      useEditorMediaHandlers("notes/active.md"),
    );

    const imageFile = new File([new Uint8Array([1, 2, 3])], "screenshot.png", {
      type: "image/png",
    });

    const link = await result.current.handlePasteAttachment(imageFile);

    expect(createFolderSpy).toHaveBeenCalledWith("images");
    expect(useWorkspaceStore.getState().allFolderPaths).toContain("images");
    expect(writeAttachmentSpy).toHaveBeenCalledWith(
      "/test/vault",
      "images",
      expect.any(String),
      imageFile,
    );
    expect(link).toBe("![[images/screenshot.png]]");
    expect(useWorkspaceStore.getState().allNotePaths).toContain(
      "images/screenshot.png",
    );
  });

  it("does not call createFolder when images folder is already present", async () => {
    useWorkspaceStore.setState({
      allFolderPaths: ["images", "other"],
    });

    const createFolderSpy = vi
      .spyOn(vaultModule, "createFolder")
      .mockResolvedValue(undefined);
    vi.spyOn(vaultModule, "writeAttachmentToVault").mockResolvedValue(
      "/test/vault/images/photo.jpg",
    );

    const { result } = renderHook(() =>
      useEditorMediaHandlers("notes/active.md"),
    );

    const imageFile = new File([new Uint8Array([4, 5, 6])], "photo.jpg", {
      type: "image/jpeg",
    });

    const link = await result.current.handlePasteAttachment(imageFile);

    expect(createFolderSpy).not.toHaveBeenCalled();
    expect(link).toBe("![[images/photo.jpg]]");
  });

  it("resolves media URLs correctly without duplicating paths", () => {
    const { result } = renderHook(() =>
      useEditorMediaHandlers("notes/active.md"),
    );

    expect(
      result.current.handleResolveMediaUrl("data:image/png;base64,..."),
    ).toBe("data:image/png;base64,...");
    expect(
      result.current.handleResolveMediaUrl("asset://localhost/foo.png"),
    ).toBe("asset://localhost/foo.png");

    const relResult = result.current.handleResolveMediaUrl("images/pic.png");
    expect(relResult).toBe("asset://localhost/test/vault/images/pic.png");

    const absResult = result.current.handleResolveMediaUrl(
      "/test/vault/images/pic.png",
    );
    expect(absResult).toBe("asset://localhost/test/vault/images/pic.png");
  });
});
