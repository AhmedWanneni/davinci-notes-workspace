import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ARTICLE_TEMPLATE, type ClipTemplate } from "@app/clipper-core";
import type { TemplateLibraryDeps } from "./templateLibraryDeps";
import { useTemplateLibrary } from "./useTemplateLibrary";

function library(
  initial: readonly ClipTemplate[] = [{ ...ARTICLE_TEMPLATE }],
  overrides: Partial<TemplateLibraryDeps> = {},
) {
  let stored = initial.map((template) => ({ ...template }));
  const save = vi.fn(async (next: readonly ClipTemplate[]) => {
    stored = next.map((template) => ({ ...template }));
  });
  const deps: TemplateLibraryDeps = {
    load: async () => stored.map((template) => ({ ...template })),
    save,
    newTemplateId: () => `generated-${stored.length}`,
    ...overrides,
  };
  return { deps, save, stored: () => stored };
}

async function ready(deps: TemplateLibraryDeps) {
  const rendered = renderHook(() => useTemplateLibrary(deps));
  await waitFor(() => expect(rendered.result.current.loading).toBe(false));
  return rendered;
}

describe("useTemplateLibrary", () => {
  it("reads what is stored and opens the first template", async () => {
    const { deps } = library();
    const { result } = await ready(deps);

    expect(result.current.templates).toHaveLength(1);
    expect(result.current.selectedId).toBe("article");
    expect(result.current.draft?.name).toBe("Article");
    expect(result.current.dirty).toBe(false);
  });

  it("stores an edit, and shows what was stored", async () => {
    const { deps, save, stored } = library();
    const { result } = await ready(deps);

    act(() => result.current.patch({ name: "Articles" }));
    expect(result.current.dirty).toBe(true);

    act(() => result.current.save());
    await waitFor(() => expect(result.current.saving).toBe(false));

    expect(save).toHaveBeenCalledTimes(1);
    expect(stored()[0]?.name).toBe("Articles");
    expect(result.current.dirty).toBe(false);
    expect(result.current.notice).toBe("Articles saved.");
  });

  it("refuses to store a draft that cannot be rendered", async () => {
    const { deps, save, stored } = library();
    const { result } = await ready(deps);

    act(() => result.current.patch({ triggers: ["/(a+)+$/"] }));
    act(() => result.current.save());

    expect(save).not.toHaveBeenCalled();
    expect(result.current.errors).toContainEqual(
      expect.stringContaining("triggers[0] repeats a group"),
    );
    expect(stored()[0]?.triggers).not.toContain("/(a+)+$/");
    expect(result.current.dirty).toBe(true);
  });

  it("puts back what was stored when the edit is discarded", async () => {
    const { deps } = library();
    const { result } = await ready(deps);

    act(() => result.current.patch({ folder: "Elsewhere" }));
    act(() => result.current.discard());

    expect(result.current.draft?.folder).toBe("Clippings");
    expect(result.current.dirty).toBe(false);
  });

  it("creates and duplicates immediately, so the list on screen is the stored list", async () => {
    const { deps, stored } = library();
    const { result } = await ready(deps);

    act(() => result.current.create());
    await waitFor(() => expect(result.current.templates).toHaveLength(2));

    expect(result.current.draft?.tags).toEqual(["clippings"]);
    expect(result.current.dirty).toBe(false);
    expect(stored()).toHaveLength(2);

    act(() => result.current.duplicate());
    await waitFor(() => expect(result.current.templates).toHaveLength(3));

    expect(result.current.draft?.name).toBe("New template copy");
    expect(result.current.draft?.id).not.toBe(result.current.templates[1]?.id);
    expect(stored()).toHaveLength(3);
  });

  it("deletes the open template and opens what is left", async () => {
    const { deps, stored } = library([
      { ...ARTICLE_TEMPLATE },
      { ...ARTICLE_TEMPLATE, id: "second", name: "Second" },
    ]);
    const { result } = await ready(deps);

    act(() => result.current.remove());
    await waitFor(() => expect(result.current.templates).toHaveLength(1));

    expect(stored().map((template) => template.id)).toEqual(["second"]);
    expect(result.current.selectedId).toBe("second");
    expect(result.current.draft?.name).toBe("Second");
  });

  it("restores the starter templates from the fallback list", async () => {
    const { deps, stored } = library();
    const { result } = await ready(deps);

    act(() => result.current.restoreStarters());
    await waitFor(() => expect(result.current.templates.length).toBe(4));

    expect(stored().map((template) => template.id)).toEqual([
      "article",
      "recipe",
      "movie",
      "paper",
    ]);
    expect(result.current.draft?.id).toBe("article");
  });

  it("reports a write that storage refused instead of claiming success", async () => {
    const { deps } = library([{ ...ARTICLE_TEMPLATE }], {
      save: async () => {
        throw new Error("Quota exceeded.");
      },
    });
    const { result } = await ready(deps);

    act(() => result.current.patch({ name: "Articles" }));
    act(() => result.current.save());
    await waitFor(() => expect(result.current.saving).toBe(false));

    expect(result.current.failure).toBe("Quota exceeded.");
    expect(result.current.dirty).toBe(true);
  });

  it("replaces the library only when an import is valid", async () => {
    const { deps, stored } = library();
    const { result } = await ready(deps);

    act(() => result.current.importTemplates("[]"));
    expect(stored()).toHaveLength(1);
    expect(result.current.failure).toContain("non-empty template array");

    act(() =>
      result.current.importTemplates(JSON.stringify([ARTICLE_TEMPLATE])),
    );
    await waitFor(() =>
      expect(result.current.notice).toBe("Templates imported."),
    );
    expect(stored()).toEqual([ARTICLE_TEMPLATE]);
  });
});
