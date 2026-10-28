import { beforeEach, describe, expect, it, vi } from "vitest";
import { isRestrictedUrl, quickClipTab } from "./quickClipTab";
import type { StorageArea } from "../storage/storageArea";
import { loadQueuedClips } from "../queue/clipQueue";
import { PAIRING_KEY } from "../pairing/pairingStore";
import { TEMPLATES_KEY } from "../templates/templateStore";
import { ARTICLE_TEMPLATE } from "@app/clipper-core";

const { executeScriptMock } = vi.hoisted(() => ({
  executeScriptMock: vi.fn(),
}));

vi.mock("wxt/browser", () => ({
  browser: {
    scripting: {
      executeScript: (...args: unknown[]) => executeScriptMock(...args),
    },
  },
}));

function createMemoryStorage(
  initial: Record<string, unknown> = {},
): StorageArea {
  const store: Record<string, unknown> = { ...initial };
  return {
    get: async (keys) => {
      if (typeof keys === "string") return { [keys]: store[keys] };
      return { ...store };
    },
    set: async (items) => {
      Object.assign(store, items);
    },
  };
}

describe("quickClipTab", () => {
  let storage: StorageArea;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = createMemoryStorage({
      [PAIRING_KEY]: { port: 54321, token: "test-token" },
      [TEMPLATES_KEY]: [ARTICLE_TEMPLATE],
    });
  });

  it("identifies restricted browser and extension URLs", () => {
    expect(isRestrictedUrl("chrome://extensions")).toBe(true);
    expect(isRestrictedUrl("chrome-extension://xyz/popup.html")).toBe(true);
    expect(isRestrictedUrl("about:blank")).toBe(true);
    expect(isRestrictedUrl("edge://settings")).toBe(true);
    expect(isRestrictedUrl("https://example.com/article")).toBe(false);
  });

  it("refuses to clip restricted URLs without executing script", async () => {
    const res = await quickClipTab(
      { id: 1, url: "chrome://extensions" },
      storage,
    );
    expect(res).toEqual({ success: false, reason: "restricted-url" });
    expect(executeScriptMock).not.toHaveBeenCalled();
  });

  it("handles script injection errors cleanly without throwing (CSP check)", async () => {
    executeScriptMock.mockRejectedValue(
      new Error("Cannot access chrome:// page"),
    );
    const res = await quickClipTab(
      { id: 1, url: "https://csp-locked.example.com" },
      storage,
    );
    expect(res).toEqual({ success: false, reason: "injection-failed" });
  });

  it("delivers clip directly when desktop app is reachable", async () => {
    executeScriptMock.mockResolvedValue([
      {
        result: {
          url: "https://example.com/test",
          title: "Test Page",
          html: "<html><head><title>Test Page</title></head><body><p>Hello world</p></body></html>",
        },
      },
    ]);

    const mockFetch = vi
      .fn()
      .mockImplementation(async (_url: string, init: { body: string }) => {
        const parsed = JSON.parse(init.body);
        return {
          status: 200,
          json: async () => ({
            clipId: parsed.clipId,
            status: "written",
            path: "Clippings/Test Page.md",
          }),
        };
      });

    const res = await quickClipTab(
      { id: 1, url: "https://example.com/test", title: "Test Page" },
      storage,
      mockFetch as never,
    );

    expect(res).toEqual({
      success: true,
      delivered: true,
      path: "Clippings/Test Page.md",
    });
  });

  it("enqueues clip when desktop app is closed / unreachable", async () => {
    executeScriptMock.mockResolvedValue([
      {
        result: {
          url: "https://example.com/offline",
          title: "Offline Page",
          html: "<html><head><title>Offline Page</title></head><body><p>Content</p></body></html>",
        },
      },
    ]);

    const mockFetch = vi
      .fn()
      .mockRejectedValue(new Error("Connection refused"));

    const res = await quickClipTab(
      { id: 1, url: "https://example.com/offline", title: "Offline Page" },
      storage,
      mockFetch as never,
    );

    expect(res).toEqual({
      success: true,
      delivered: false,
      queued: true,
      reason: "unreachable",
    });

    const queued = await loadQueuedClips(storage);
    expect(queued).toHaveLength(1);
    expect(queued[0]?.payload.source.url).toBe("https://example.com/offline");
  });

  it("supports bookmark mode for quick context-menu link bookmarking", async () => {
    executeScriptMock.mockResolvedValue([
      {
        result: {
          url: "https://example.com/bookmark-me",
          title: "Bookmark Me",
          html: "<html><head><title>Bookmark Me</title></head><body></body></html>",
        },
      },
    ]);

    let sentMode = "";
    const mockFetch = vi
      .fn()
      .mockImplementation(async (_url: string, init: { body: string }) => {
        const parsed = JSON.parse(init.body);
        sentMode = parsed.mode;
        return {
          status: 200,
          json: async () => ({
            clipId: parsed.clipId,
            status: "written",
            path: ".davinci/bookmarks.json",
          }),
        };
      });

    const res = await quickClipTab(
      { id: 1, url: "https://example.com/bookmark-me", title: "Bookmark Me" },
      storage,
      mockFetch as never,
      "bookmark",
    );

    expect(sentMode).toBe("bookmark");
    expect(res).toEqual({
      success: true,
      delivered: true,
      path: ".davinci/bookmarks.json",
    });
  });
});
