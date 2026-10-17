// @vitest-environment jsdom
import fs from "node:fs";
import path from "node:path";
import { history, undo } from "@codemirror/commands";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it } from "vitest";
import { insertItem } from "./InsertAction";
import { findInsertItem } from "./InsertRegistry";
import { loadInsertRegistry } from "./loadInsertRegistry";

if (typeof Range !== "undefined" && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
}

let activeView: EditorView | undefined;

function createTestView(doc: string, cursor = 0, editable = true) {
  activeView?.destroy();
  const state = EditorState.create({
    doc,
    selection: EditorSelection.cursor(cursor),
    extensions: [history(), EditorView.editable.of(editable)],
  });
  activeView = new EditorView({ state });
  return activeView;
}

afterEach(() => {
  activeView?.destroy();
  activeView = undefined;
});

describe("Diagram insertion behavior and lazy-loading", () => {
  const flowchart = findInsertItem("diagram-flowchart")!;

  it("inserts diagram into empty note without extra blank lines", () => {
    const view = createTestView("");
    const ok = insertItem(view, flowchart);
    expect(ok).toBe(true);

    const doc = view.state.doc.toString();
    expect(doc.startsWith("```mermaid\ngraph TD")).toBe(true);
    expect(doc.endsWith("```")).toBe(true);
    expect(doc.startsWith("\n")).toBe(false);
  });

  it("pads with blank lines when inserted mid-paragraph", () => {
    const original = "First line of text.\nSecond line of text.";
    const view = createTestView(original, 19); // at newline
    const ok = insertItem(view, flowchart);
    expect(ok).toBe(true);

    const doc = view.state.doc.toString();
    expect(doc).toContain("First line of text.\n\n```mermaid\n");
    expect(doc).toContain("\n```\n\nSecond line of text.");
  });

  it("pads with blank lines when inserted at end of a list item", () => {
    const original = "- List item 1\n- List item 2";
    const view = createTestView(original, original.length);
    const ok = insertItem(view, flowchart);
    expect(ok).toBe(true);

    const doc = view.state.doc.toString();
    expect(doc).toContain("- List item 2\n\n```mermaid\n");
  });

  it("replaces active selection and seeds the first placeholder", () => {
    const original = "Selected Title";
    const view = createTestView(original);
    view.dispatch({
      selection: EditorSelection.range(0, original.length),
    });

    const ok = insertItem(view, flowchart);
    expect(ok).toBe(true);

    const doc = view.state.doc.toString();
    expect(doc).toContain("Selected Title");
  });

  it("reverts entire diagram insertion in one undo", () => {
    const original = "Before diagram";
    const view = createTestView(original, original.length);
    insertItem(view, flowchart);
    expect(view.state.doc.toString()).not.toBe(original);

    undo(view);
    expect(view.state.doc.toString()).toBe(original);
  });

  it("is a no-op in read-only editor views", () => {
    const original = "Read only text";
    const view = createTestView(original, 0, false);
    const ok = insertItem(view, flowchart);
    expect(ok).toBe(false);
    expect(view.state.doc.toString()).toBe(original);
  });

  it("guarantees mermaid is not imported by insert menu modules", async () => {
    const insertDir = path.resolve(__dirname);
    const files = fs
      .readdirSync(insertDir, { recursive: true })
      .filter((file) => typeof file === "string" && /\.(ts|tsx)$/.test(file))
      .filter((file) => !file.includes(".test."));

    for (const file of files) {
      const fullPath = path.join(insertDir, file);
      const content = fs.readFileSync(fullPath, "utf-8");
      expect(content).not.toMatch(/from\s+["']mermaid["']/);
      expect(content).not.toMatch(/import\(["']mermaid["']\)/);
    }

    const { insertRegistry: loaded } = await loadInsertRegistry();
    expect(loaded.length).toBeGreaterThanOrEqual(39);
  });
});
