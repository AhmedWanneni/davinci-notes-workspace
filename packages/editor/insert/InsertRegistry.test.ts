import { describe, expect, it } from "vitest";
import { findInsertItem, insertRegistry } from "./InsertRegistry";

describe("insertRegistry", () => {
  it("contains all insert items including Links, Media, and Diagrams", () => {
    expect(insertRegistry).toHaveLength(42);
    expect(insertRegistry.map((item) => item.group)).toEqual(
      expect.arrayContaining([
        "Basics",
        "Links",
        "Code and data",
        "HTML",
        "Media",
        "Diagrams",
      ]),
    );
  });

  it("builds reminder item syntax with date and optional time", () => {
    const item = findInsertItem("reminder");
    expect(item).toBeDefined();
    expect(item?.group).toBe("Basics");
    expect(item?.dialog?.kind).toBe("reminder-picker");

    // Without time
    expect(
      item?.build({ selectedText: "", input: { date: "2026-10-15" } }),
    ).toEqual({
      text: "(@2026-10-15)",
      block: false,
    });

    // With time
    expect(
      item?.build({
        selectedText: "",
        input: { date: "2026-10-15", time: "14:30" },
      }),
    ).toEqual({
      text: "(@2026-10-15 14:30)",
      block: false,
    });
  });

  it("builds note-embed item syntax with target and optional heading", () => {
    const item = findInsertItem("note-embed");
    expect(item).toBeDefined();
    expect(item?.group).toBe("Links");
    expect(item?.dialog?.kind).toBe("note-picker");

    // Without heading
    expect(
      item?.build({ selectedText: "", input: { target: "Alpha" } }),
    ).toEqual({
      text: "![[Alpha]]",
      block: true,
    });

    // With heading
    expect(
      item?.build({
        selectedText: "",
        input: { target: "Alpha", heading: "Section One" },
      }),
    ).toEqual({
      text: "![[Alpha#Section One]]",
      block: true,
    });

    // Validation
    expect(item?.dialog?.validate?.({})).toBe("Please choose a note to embed.");
    expect(item?.dialog?.validate?.({ target: "Alpha" })).toBeNull();
  });

  it("uses selected text as the first snippet placeholder", () => {
    expect(
      findInsertItem("heading-1")?.build({ selectedText: "Chosen" }),
    ).toEqual({
      text: "# ${1:Chosen}",
      block: true,
    });
  });

  it("builds the table and footnote templates with placeholders", () => {
    expect(findInsertItem("table")?.build({ selectedText: "" }).text).toContain(
      "${1:Header 1}",
    );
    expect(findInsertItem("footnote")?.build({ selectedText: "" }).text).toBe(
      "[^${1:1}]\n\n[^${1:1}]: ${2:Footnote}",
    );
  });

  it("builds kanban-board item with dialog and starter template", () => {
    const item = findInsertItem("kanban-board");
    expect(item).toBeDefined();
    expect(item?.group).toBe("Code and data");
    expect(item?.dialog?.kind).toBe("kanban-creator");
    expect(item?.dialog?.validate?.({})).toBe("Please enter a board name.");
    expect(item?.dialog?.validate?.({ name: "Sprint" })).toBeNull();

    const result = item?.build({ selectedText: "" });
    expect(result?.block).toBe(true);
    expect(result?.text).toContain("kanban-plugin: board");
    expect(result?.text).toContain("# Kanban Board");
    expect(result?.text).toContain("## To Do");
    expect(result?.text).toContain("## Doing");
    expect(result?.text).toContain("## Done");

    const customResult = item?.build({ selectedText: "Sprint 42" });
    expect(customResult?.text).toContain("# Sprint 42");
  });
});
