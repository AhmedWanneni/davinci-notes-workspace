import { act, renderHook, waitFor } from "@testing-library/react";
import { STARTER_TEMPLATES } from "@app/clipper-core";
import { describe, expect, it, vi } from "vitest";
import type { PageCapture } from "../capture/readPage";
import { ARTICLE_PAGE_HTML, RECIPE_PAGE_HTML } from "../fixtures/pages";
import type { ClipDelivery } from "../transport/postClipToDesktop";
import type { ClipSessionDeps } from "./clipSessionDeps";
import { useClipSession } from "./useClipSession";

function capture(
  html: string,
  overrides: Partial<PageCapture> = {},
): PageCapture {
  return {
    url: "https://probe.example/a",
    title: "Probe Article",
    html,
    ...overrides,
  };
}

function deps(overrides: Partial<ClipSessionDeps> = {}): ClipSessionDeps {
  return {
    readCapture: async () => capture(ARTICLE_PAGE_HTML),
    loadTemplates: async () => [...STARTER_TEMPLATES],
    loadPairing: async () => undefined,
    loadHighlights: async () => [],
    saveHighlight: vi.fn(async () => {}),
    notifyHighlightsUpdated: vi.fn(async () => {}),
    saveNoteFile: vi.fn(async () => {}),
    sendClip: async (): Promise<ClipDelivery> => ({ delivered: true }),
    openOptionsPage: vi.fn(),
    now: () => new Date("2026-10-17T09:05:07.000Z"),
    newClipId: () => "clip-test",
    ...overrides,
  };
}

describe("useClipSession", () => {
  it("reads the page once and applies the template matched to it", async () => {
    const readCapture = vi.fn(async () => capture(ARTICLE_PAGE_HTML));
    const { result } = renderHook(() => useClipSession(deps({ readCapture })));

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(readCapture).toHaveBeenCalledTimes(1);
    expect(result.current.templateId).toBe("article");
    expect(result.current.matchedTemplateId).toBe("article");
    expect(result.current.payload?.templateId).toBe("article");
    expect(result.current.payload?.target.folder).toBe("Clippings");
    expect(result.current.payload?.target.noteName).toBe("Probe Article.md");
    expect(result.current.payload?.clipId).toBe("clip-test");
    expect(result.current.payload?.capturedAt).toBe("2026-10-17T09:05:07.000Z");
  });

  it("matches a different template by the page's own Schema.org types", async () => {
    const { result } = renderHook(() =>
      useClipSession(
        deps({ readCapture: async () => capture(RECIPE_PAGE_HTML) }),
      ),
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.templateId).toBe("recipe");
    expect(result.current.payload?.target.folder).toBe("Clippings/Recipes");
  });

  it("defaults to the selected text and disables the modes with no source", async () => {
    const { result } = renderHook(() =>
      useClipSession(
        deps({
          readCapture: async () =>
            capture(ARTICLE_PAGE_HTML, {
              selection: "Picked text",
              selectionHtml: "<p>Picked text</p>",
            }),
        }),
      ),
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.mode).toBe("selection");
    expect(result.current.payload?.mode).toBe("selection");
    // Highlights have no source until the picker ships, and selection is
    // available here, so only highlights is unavailable.
    expect(result.current.disabledModes).toEqual(["highlights"]);
  });

  it("defaults to the full page when nothing is selected", async () => {
    const { result } = renderHook(() => useClipSession(deps()));

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.mode).toBe("full");
    expect(result.current.disabledModes).toEqual(["highlights", "selection"]);
  });

  it("re-renders for a chosen template without reading the page again", async () => {
    const readCapture = vi.fn(async () => capture(ARTICLE_PAGE_HTML));
    const { result } = renderHook(() => useClipSession(deps({ readCapture })));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.setTemplateId("recipe"));

    await waitFor(() =>
      expect(result.current.payload?.templateId).toBe("recipe"),
    );
    expect(result.current.payload?.target.folder).toBe("Clippings/Recipes");
    expect(readCapture).toHaveBeenCalledTimes(1);
  });

  it("re-prepares the content when the mode changes", async () => {
    const { result } = renderHook(() =>
      useClipSession(
        deps({
          readCapture: async () =>
            capture(ARTICLE_PAGE_HTML, { selection: "Picked text" }),
        }),
      ),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.setMode("full"));

    await waitFor(() => expect(result.current.payload?.mode).toBe("full"));
    expect(result.current.payload?.body).toContain("Probe Article");
  });

  it("saves the note under its suggested path", async () => {
    const saveNoteFile = vi.fn(async () => {});
    const { result } = renderHook(() => useClipSession(deps({ saveNoteFile })));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      result.current.download();
    });

    await waitFor(() => expect(saveNoteFile).toHaveBeenCalledTimes(1));
    expect(saveNoteFile).toHaveBeenCalledWith(
      "Clippings/Probe Article.md",
      expect.stringContaining("clippings"),
    );
    expect(result.current.downloading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it("sends the clip to the app and reports the path it wrote", async () => {
    const sendClip = vi.fn(async (): Promise<ClipDelivery> => ({
      delivered: true,
      path: "Clippings/Probe Article.md",
    }));
    const { result } = renderHook(() =>
      useClipSession(
        deps({
          loadPairing: async () => ({ port: 47912, token: "abc" }),
          sendClip,
        }),
      ),
    );
    await waitFor(() => expect(result.current.paired).toBe(true));

    await act(async () => {
      result.current.send();
    });

    await waitFor(() => expect(result.current.sent).toBe(true));
    expect(sendClip).toHaveBeenCalledTimes(1);
    expect(sendClip.mock.calls[0][0].clipId).toBe("clip-test");
    expect(result.current.sentPath).toBe("Clippings/Probe Article.md");
    expect(result.current.sending).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it("keeps the clip when the app refuses it, and says why", async () => {
    const { result } = renderHook(() =>
      useClipSession(
        deps({
          loadPairing: async () => ({ port: 47912, token: "abc" }),
          sendClip: async () => ({ delivered: false, reason: "unauthorized" }),
        }),
      ),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      result.current.send();
    });

    await waitFor(() =>
      expect(result.current.error).toMatch(/refused the pairing token/),
    );
    expect(result.current.sent).toBe(false);
    expect(result.current.status).toBe("ready");
    expect(result.current.payload).toBeDefined();
  });

  it("keeps the clip when the app cannot be reached", async () => {
    const { result } = renderHook(() =>
      useClipSession(
        deps({
          loadPairing: async () => ({ port: 47912, token: "abc" }),
          sendClip: async () => ({ delivered: false, reason: "unreachable" }),
        }),
      ),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      result.current.send();
    });

    await waitFor(() => expect(result.current.error).toMatch(/not sent/));
    expect(result.current.payload).toBeDefined();
  });

  it("reports an unpaired extension from the send path", async () => {
    const sendClip = vi.fn(async (): Promise<ClipDelivery> => ({
      delivered: false,
      reason: "not-paired",
    }));
    const { result } = renderHook(() => useClipSession(deps({ sendClip })));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.paired).toBe(false);
    await act(async () => {
      result.current.send();
    });

    await waitFor(() => expect(result.current.error).toMatch(/not paired/));
    expect(sendClip).toHaveBeenCalledTimes(1);
  });

  it("opens the extension's pairing options when asked", async () => {
    const openOptionsPage = vi.fn();
    const { result } = renderHook(() =>
      useClipSession(deps({ openOptionsPage })),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.openOptions());

    expect(openOptionsPage).toHaveBeenCalledTimes(1);
  });

  it("surfaces a save that fails as a thrown error", async () => {
    const { result } = renderHook(() =>
      useClipSession(
        deps({
          sendClip: async () => {
            throw new Error("The seam misbehaved.");
          },
        }),
      ),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      result.current.send();
    });

    await waitFor(() =>
      expect(result.current.error).toBe("The seam misbehaved."),
    );
  });

  it("reports a page it cannot read", async () => {
    const { result } = renderHook(() =>
      useClipSession(
        deps({
          readCapture: async () => {
            throw new Error("This page could not be read.");
          },
        }),
      ),
    );

    await waitFor(() => expect(result.current.status).toBe("error"));

    expect(result.current.error).toBe("This page could not be read.");
    expect(result.current.payload).toBeUndefined();
  });

  it("keeps the clip available when saving fails", async () => {
    const { result } = renderHook(() =>
      useClipSession(
        deps({
          saveNoteFile: async () => {
            throw new Error("Download refused.");
          },
        }),
      ),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      result.current.download();
    });

    await waitFor(() => expect(result.current.error).toBe("Download refused."));
    expect(result.current.status).toBe("ready");
    expect(result.current.payload).toBeDefined();
  });

  it("falls back to a usable template when storage returns none", async () => {
    const { result } = renderHook(() =>
      useClipSession(deps({ loadTemplates: async () => [] })),
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.templates.length).toBeGreaterThan(0);
    expect(result.current.templateId).not.toBe("");
    expect(result.current.payload).toBeDefined();
  });

  it("saves under the name the user typed, sanitised", async () => {
    const saveNoteFile = vi.fn(async () => {});
    const { result } = renderHook(() => useClipSession(deps({ saveNoteFile })));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.setNoteName("../Probe Soup"));
    act(() => result.current.setFolder("Clippings/Soups/"));

    // The field shows what was typed; the clip is what will actually be written.
    expect(result.current.draft.noteName).toBe("../Probe Soup");
    expect(result.current.payload?.target.noteName).toBe("Probe Soup.md");
    expect(result.current.payload?.target.folder).toBe("Clippings/Soups");

    await act(async () => {
      result.current.download();
    });

    await waitFor(() => expect(saveNoteFile).toHaveBeenCalledTimes(1));
    expect(saveNoteFile).toHaveBeenCalledWith(
      "Clippings/Soups/Probe Soup.md",
      expect.any(String),
    );
  });

  it("edits a frontmatter property and drops it when cleared", async () => {
    const { result } = renderHook(() => useClipSession(deps()));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.setProperty("author", "Grace Hopper"));
    expect(result.current.payload?.properties.author).toBe("Grace Hopper");

    act(() => result.current.setProperty("author", ""));
    expect(result.current.payload?.properties).not.toHaveProperty("author");
  });

  it("discards hand edits when the template changes", async () => {
    const { result } = renderHook(() => useClipSession(deps()));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    act(() => result.current.setNoteName("Renamed"));
    expect(result.current.draft.noteName).toBe("Renamed");

    act(() => result.current.setTemplateId("recipe"));

    await waitFor(() =>
      expect(result.current.draft.folder).toBe("Clippings/Recipes"),
    );
    expect(result.current.draft.noteName).toBe("Probe Article.md");
  });
});
