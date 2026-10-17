import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  computeVaultRelativeLink,
  copyImageFileToVault,
} from "./insertLocalImage";
import * as vaultModule from "../../vault";
import type { AttachmentSettings } from "@app/attachments";

describe("insertLocalImage pipeline integration", () => {
  const dummySettings: AttachmentSettings = {
    locationMode: "specified-folder",
    specifiedFolder: "attachments",
    noteSubfolder: "attachments",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("computes vault-relative links correctly", () => {
    expect(
      computeVaultRelativeLink(
        "/Users/user/Vault",
        "/Users/user/Vault/attachments/cat.png",
      ),
    ).toBe("attachments/cat.png");

    expect(
      computeVaultRelativeLink("C:/Vault", "C:/Vault/photos/dog.png"),
    ).toBe("photos/dog.png");
  });

  it("writes local file under attachments folder, returns vault-relative link, and avoids collision", async () => {
    const writtenFiles = new Map<string, Uint8Array>();

    vi.spyOn(vaultModule, "writeAttachmentToVault").mockImplementation(
      async (vaultPath, targetFolder, desiredFilename, data) => {
        let suffix = 0;
        const [stem, ext] = desiredFilename.includes(".")
          ? [
              desiredFilename.slice(0, desiredFilename.lastIndexOf(".")),
              desiredFilename.slice(desiredFilename.lastIndexOf(".")),
            ]
          : [desiredFilename, ""];

        let candidate = desiredFilename;
        let finalPath = `${vaultPath}/${targetFolder}/${candidate}`;
        while (writtenFiles.has(finalPath)) {
          suffix += 1;
          candidate = `${stem} ${suffix}${ext}`;
          finalPath = `${vaultPath}/${targetFolder}/${candidate}`;
        }

        const bytes =
          data instanceof Uint8Array ? data : new Uint8Array([1, 2, 3]);
        writtenFiles.set(finalPath, bytes);
        return finalPath;
      },
    );

    const vaultPath = "/home/user/vault";
    const options = {
      vaultPath,
      activeNotePath: "daily/note.md",
      attachmentSettings: dummySettings,
    };

    // First write
    const link1 = await copyImageFileToVault(
      options,
      "diagram.png",
      new Uint8Array([1, 2, 3]),
    );

    expect(link1).toBe("attachments/diagram.png");
    expect(writtenFiles.has("/home/user/vault/attachments/diagram.png")).toBe(
      true,
    );

    // Second write with same filename: must not overwrite first
    const link2 = await copyImageFileToVault(
      options,
      "diagram.png",
      new Uint8Array([4, 5, 6]),
    );

    expect(link2).toBe("attachments/diagram 1.png");
    expect(writtenFiles.has("/home/user/vault/attachments/diagram 1.png")).toBe(
      true,
    );
    expect(writtenFiles.get("/home/user/vault/attachments/diagram.png")).toEqual(
      new Uint8Array([1, 2, 3]),
    );
  });
});
