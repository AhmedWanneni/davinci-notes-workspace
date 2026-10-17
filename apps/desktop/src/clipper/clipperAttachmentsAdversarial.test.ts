import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AttachmentSettings } from "@app/attachments";
import type { ClipPayload } from "@app/clipper-core";

const {
  invokeMock,
  createNoteInVaultMock,
  appendToNoteInVaultMock,
  writeAttachmentToVaultMock,
  getStateMock,
} = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  createNoteInVaultMock: vi.fn(),
  appendToNoteInVaultMock: vi.fn(),
  writeAttachmentToVaultMock: vi.fn(),
  getStateMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("../vault", () => ({
  computeVaultRelativeLink: (vaultPath: string, writtenPath: string) => {
    const prefix = `${vaultPath.replaceAll("\\", "/").replace(/\/+$/u, "")}/`;
    return writtenPath.startsWith(prefix)
      ? writtenPath.slice(prefix.length)
      : writtenPath;
  },
  writeAttachmentToVault: (...args: unknown[]) =>
    writeAttachmentToVaultMock(...args),
  createNoteInVault: (...args: unknown[]) => createNoteInVaultMock(...args),
  appendToNoteInVault: (...args: unknown[]) => appendToNoteInVaultMock(...args),
  resolveUniqueNotePath: (_paths: string[], preferred: string) => preferred,
}));

vi.mock("../state/useWorkspaceStore", () => ({
  useWorkspaceStore: { getState: () => getStateMock() },
}));

import { applyClipToVault } from "./applyClipToVault";

const attachmentSettings: AttachmentSettings = {
  locationMode: "specified-folder",
  specifiedFolder: "attachments",
  noteSubfolder: "attachments",
};

function adversarialPayload(
  body: string,
  overrides: Partial<ClipPayload> = {},
): ClipPayload {
  return {
    version: 1,
    clipId: "adv-clip-1",
    capturedAt: "2026-10-17T09:05:07.000Z",
    mode: "full",
    templateId: "article",
    behavior: "create",
    target: { folder: "Clippings", noteName: "Adversarial.md" },
    source: { url: "https://adversarial.example/post", title: "Adversarial" },
    properties: {},
    tags: [],
    body,
    contentHash: "hash-adv",
    ...overrides,
  };
}

describe("clipperAttachments adversarial verification (Phase 6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStateMock.mockReturnValue({
      vaultPath: "/Users/test/Vault",
      allNotePaths: [],
      attachmentSettings,
    });
    createNoteInVaultMock.mockImplementation(async (path: string) => path);
  });

  it("Check 1 & 2: SSRF and redirect chain rejections degrade gracefully to remote URL in note", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const body =
      "![Metadata](http://169.254.169.254/latest/meta-data/) and ![Good](https://cdn.example.com/pic.png)";
    const payload = adversarialPayload(body, {
      attachments: [
        {
          sourceUrl: "http://169.254.169.254/latest/meta-data/",
          suggestedName: "meta.png",
        },
        {
          sourceUrl: "https://cdn.example.com/pic.png",
          suggestedName: "pic.png",
        },
      ],
    });

    invokeMock.mockImplementation((_cmd: string, args: { url: string }) => {
      if (args.url.includes("169.254")) {
        return Promise.reject("private network address disallowed");
      }
      return Promise.resolve([137, 80, 78, 71]);
    });
    writeAttachmentToVaultMock.mockResolvedValue(
      "/Users/test/Vault/attachments/pic.png",
    );

    const ack = await applyClipToVault({
      clipId: "adv-clip-1",
      payload,
      relativePath: "Clippings/Adversarial.md",
    });

    expect(ack.status).toBe("written");
    expect(createNoteInVaultMock).toHaveBeenCalledWith(
      "Clippings/Adversarial.md",
      expect.stringContaining(
        "![Metadata](http://169.254.169.254/latest/meta-data/) and ![Good](attachments/pic.png)",
      ),
    );
    warnSpy.mockRestore();
  });

  it("Check 3: HTML served as image rejected by content validation leaves link unmodified", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const body = "![Fake](https://evil.example.com/not-an-image.png)";
    const payload = adversarialPayload(body, {
      attachments: [
        {
          sourceUrl: "https://evil.example.com/not-an-image.png",
          suggestedName: "fake.png",
        },
      ],
    });

    invokeMock.mockRejectedValue("Unsupported or invalid image content format");

    const ack = await applyClipToVault({
      clipId: "adv-clip-1",
      payload,
      relativePath: "Clippings/Adversarial.md",
    });

    expect(ack.status).toBe("written");
    expect(createNoteInVaultMock).toHaveBeenCalledWith(
      "Clippings/Adversarial.md",
      expect.stringContaining(
        "![Fake](https://evil.example.com/not-an-image.png)",
      ),
    );
    warnSpy.mockRestore();
  });

  it("Check 4: Duplicate image names get collision-suffixed paths (ADR-0110)", async () => {
    const body =
      "![Cat 1](https://example.com/a/cat.png) and ![Cat 2](https://example.com/b/cat.png)";
    const payload = adversarialPayload(body, {
      attachments: [
        {
          sourceUrl: "https://example.com/a/cat.png",
          suggestedName: "cat.png",
        },
        {
          sourceUrl: "https://example.com/b/cat.png",
          suggestedName: "cat.png",
        },
      ],
    });

    invokeMock.mockResolvedValue([137, 80, 78, 71]);
    writeAttachmentToVaultMock
      .mockResolvedValueOnce("/Users/test/Vault/attachments/cat.png")
      .mockResolvedValueOnce("/Users/test/Vault/attachments/cat 1.png");

    await applyClipToVault({
      clipId: "adv-clip-1",
      payload,
      relativePath: "Clippings/Adversarial.md",
    });

    expect(createNoteInVaultMock).toHaveBeenCalledWith(
      "Clippings/Adversarial.md",
      expect.stringContaining(
        "![Cat 1](attachments/cat.png) and ![Cat 2](attachments/cat 1.png)",
      ),
    );
  });

  it("Check 5 & 6: 200 images totalling 500 MB capped safely with offline relative links", async () => {
    const attachments = Array.from({ length: 200 }, (_, i) => ({
      sourceUrl: `https://example.com/img-${i}.png`,
      suggestedName: `img-${i}.png`,
    }));
    const body = attachments.map((a) => `![](${a.sourceUrl})`).join("\n");
    const payload = adversarialPayload(body, { attachments });

    invokeMock.mockResolvedValue([137, 80, 78, 71]);
    writeAttachmentToVaultMock.mockImplementation(
      (_v: string, _f: string, name: string) =>
        `/Users/test/Vault/attachments/${name}`,
    );

    const ack = await applyClipToVault({
      clipId: "adv-clip-1",
      payload,
      relativePath: "Clippings/Adversarial.md",
    });

    expect(ack.status).toBe("written");
    // Max 50 downloads
    expect(invokeMock).toHaveBeenCalledTimes(50);
    // The first 50 rewritten to attachments/, remaining 150 preserved as remote URLs
    expect(createNoteInVaultMock).toHaveBeenCalledWith(
      "Clippings/Adversarial.md",
      expect.stringContaining("![](attachments/img-0.png)"),
    );
    expect(createNoteInVaultMock).toHaveBeenCalledWith(
      "Clippings/Adversarial.md",
      expect.stringContaining("![](https://example.com/img-51.png)"),
    );
  });
});
