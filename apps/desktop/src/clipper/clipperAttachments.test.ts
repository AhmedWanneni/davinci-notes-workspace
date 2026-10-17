import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AttachmentSettings } from "@app/attachments";
import type { ClipPayload } from "@app/clipper-core";

const { invokeMock, writeAttachmentToVaultMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  writeAttachmentToVaultMock: vi.fn(),
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
}));

import {
  MAX_CLIP_ATTACHMENTS,
  processClipAttachments,
} from "./clipperAttachments";

const dummySettings: AttachmentSettings = {
  locationMode: "specified-folder",
  specifiedFolder: "assets",
  noteSubfolder: "assets",
};

function basePayload(overrides: Partial<ClipPayload> = {}): ClipPayload {
  return {
    version: 1,
    clipId: "clip-att-1",
    capturedAt: "2026-10-17T09:05:07.000Z",
    mode: "full",
    templateId: "article",
    behavior: "create",
    target: { folder: "Clippings", noteName: "Test.md" },
    source: { url: "https://example.com/post", title: "Test" },
    properties: {},
    tags: [],
    body: "Here is an image: ![Cat](https://example.com/cat.png)",
    contentHash: "hash-123",
    ...overrides,
  };
}

describe("clipperAttachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the payload unchanged if no attachments are present", async () => {
    const payload = basePayload({ attachments: [] });
    const result = await processClipAttachments(payload, {
      vaultPath: "/Users/test/Vault",
      activeNotePath: "Clippings/Test.md",
      attachmentSettings: dummySettings,
    });
    expect(result).toBe(payload);
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("downloads images, writes to vault, and rewrites markdown image links", async () => {
    const payload = basePayload({
      attachments: [
        { sourceUrl: "https://example.com/cat.png", suggestedName: "cat.png" },
      ],
    });

    invokeMock.mockResolvedValue([137, 80, 78, 71]);
    writeAttachmentToVaultMock.mockResolvedValue(
      "/Users/test/Vault/assets/cat.png",
    );

    const result = await processClipAttachments(payload, {
      vaultPath: "/Users/test/Vault",
      activeNotePath: "Clippings/Test.md",
      attachmentSettings: dummySettings,
    });

    expect(invokeMock).toHaveBeenCalledWith("clipper_fetch_attachment", {
      url: "https://example.com/cat.png",
    });
    expect(writeAttachmentToVaultMock).toHaveBeenCalledWith(
      "/Users/test/Vault",
      "assets",
      "cat.png",
      expect.any(Uint8Array),
    );
    expect(result.body).toBe("Here is an image: ![Cat](assets/cat.png)");
  });

  it("handles partial success when an image fetch fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const payload = basePayload({
      body: "![Ok](https://example.com/ok.png) and ![Fail](https://example.com/fail.png)",
      attachments: [
        {
          sourceUrl: "https://example.com/fail.png",
          suggestedName: "fail.png",
        },
        { sourceUrl: "https://example.com/ok.png", suggestedName: "ok.png" },
      ],
    });

    invokeMock.mockImplementation((cmd: string, args: { url: string }) => {
      if (args.url.includes("fail")) throw new Error("SSRF blocked");
      return Promise.resolve([137, 80, 78, 71]);
    });
    writeAttachmentToVaultMock.mockResolvedValue(
      "/Users/test/Vault/assets/ok.png",
    );

    const result = await processClipAttachments(payload, {
      vaultPath: "/Users/test/Vault",
      activeNotePath: "Clippings/Test.md",
      attachmentSettings: dummySettings,
    });

    expect(result.body).toBe(
      "![Ok](assets/ok.png) and ![Fail](https://example.com/fail.png)",
    );
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("caps image downloads at MAX_CLIP_ATTACHMENTS (50)", async () => {
    const attachments = Array.from({ length: 60 }, (_, i) => ({
      sourceUrl: `https://example.com/img-${i}.png`,
      suggestedName: `img-${i}.png`,
    }));
    const payload = basePayload({ attachments });

    invokeMock.mockResolvedValue([1, 2, 3]);
    writeAttachmentToVaultMock.mockImplementation(
      (_v: string, _f: string, name: string) =>
        `/Users/test/Vault/assets/${name}`,
    );

    await processClipAttachments(payload, {
      vaultPath: "/Users/test/Vault",
      activeNotePath: "Clippings/Test.md",
      attachmentSettings: dummySettings,
    });

    expect(invokeMock).toHaveBeenCalledTimes(MAX_CLIP_ATTACHMENTS);
    expect(writeAttachmentToVaultMock).toHaveBeenCalledTimes(
      MAX_CLIP_ATTACHMENTS,
    );
  });

  it("caps image downloads when cumulative size exceeds MAX_TOTAL_ATTACHMENT_BYTES", async () => {
    const attachments = [
      {
        sourceUrl: "https://example.com/large1.png",
        suggestedName: "large1.png",
      },
      {
        sourceUrl: "https://example.com/large2.png",
        suggestedName: "large2.png",
      },
      {
        sourceUrl: "https://example.com/large3.png",
        suggestedName: "large3.png",
      },
    ];
    const payload = basePayload({ attachments });

    // 11 MiB per image -> second image exceeds 20 MiB total
    const bigChunk = new Uint8Array(11 * 1024 * 1024);
    invokeMock.mockResolvedValue(bigChunk);
    writeAttachmentToVaultMock.mockResolvedValue(
      "/Users/test/Vault/assets/large1.png",
    );

    await processClipAttachments(payload, {
      vaultPath: "/Users/test/Vault",
      activeNotePath: "Clippings/Test.md",
      attachmentSettings: dummySettings,
    });

    // 1st passes (11 MiB <= 20 MiB). 2nd is fetched (11 MiB), total would be 22 MiB > 20 MiB, so loop breaks
    expect(writeAttachmentToVaultMock).toHaveBeenCalledTimes(1);
  });
});
