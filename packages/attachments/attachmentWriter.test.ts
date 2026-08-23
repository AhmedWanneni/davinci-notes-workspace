import { describe, expect, it } from "vitest";
import { AttachmentWriteError, writeAttachment, type AttachmentFileSystem } from "./index";

function fakeFileSystem(existing: string[] = []) {
  const files = new Set(existing);
  const folders: string[] = [];
  const writes: Array<[string, Uint8Array]> = [];
  const fileSystem: AttachmentFileSystem = {
    exists: async (path) => files.has(path),
    mkdir: async (path) => { folders.push(path); },
    writeFile: async (path, data) => { files.add(path); writes.push([path, data]); },
  };
  return { fileSystem, files, folders, writes };
}

describe("writeAttachment", () => {
  it.each(["", "media", "notes/assets", "custom/folder"])(
    "writes to the resolved target folder: %s",
    async (targetFolder) => {
      const fake = fakeFileSystem();
      const path = await writeAttachment(fake.fileSystem, "/vault", targetFolder, "image.png", new Uint8Array([1, 2]));
      expect(path).toBe(targetFolder ? `/vault/${targetFolder}/image.png` : "/vault/image.png");
      expect(fake.writes[0]?.[1]).toEqual(new Uint8Array([1, 2]));
    },
  );

  it("creates a missing multi-level folder before writing", async () => {
    const fake = fakeFileSystem();
    await writeAttachment(fake.fileSystem, "/vault", "one/two/three", "clip.mp4", new Uint8Array());
    expect(fake.folders).toEqual(["/vault/one/two/three"]);
  });

  it("adds numeric suffixes before the extension on collisions", async () => {
    const fake = fakeFileSystem([
      "/vault/media/image.png",
      "/vault/media/image 1.png",
    ]);
    const path = await writeAttachment(fake.fileSystem, "/vault", "media", "image.png", new Uint8Array());
    expect(path).toBe("/vault/media/image 2.png");
  });

  it("rejects unsupported formats with a structured error", async () => {
    const promise = writeAttachment(fakeFileSystem().fileSystem, "/vault", "", "script.exe", new Uint8Array());
    await expect(promise).rejects.toBeInstanceOf(AttachmentWriteError);
    await expect(promise).rejects.toMatchObject({ code: "unsupported-format" });
  });

  it("rejects path traversal in filenames", async () => {
    await expect(writeAttachment(fakeFileSystem().fileSystem, "/vault", "", "../evil.png", new Uint8Array()))
      .rejects.toMatchObject({ code: "invalid-filename" });
  });
});
