// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { listExtension } from "./listExtension";

function createEditor(doc: string, selectionHead = 0, isReadOnly = false) {
  const state = EditorState.create({
    doc,
    selection: { anchor: selectionHead },
    extensions: [
      listExtension({ isReadOnly }),
      EditorView.editable.of(!isReadOnly),
    ],
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({ state, parent: container });
  return { view, cleanup: () => container.remove() };
}

describe("listExtension styling and hanging indents", () => {
  it("assigns appropriate list line classes across nested levels", () => {
    const doc = [
      "- Level 0 item",
      "  - Level 1 item",
      "    - Level 2 item",
      "      - Level 3 item",
    ].join("\n");

    const { view, cleanup } = createEditor(doc, 0, true);
    try {
      const lines = view.dom.querySelectorAll(".cm-line");
      expect(lines.length).toBe(4);
      expect(lines[0]?.classList.contains("cm-list-level-0")).toBe(true);
      expect(lines[1]?.classList.contains("cm-list-level-1")).toBe(true);
      expect(lines[2]?.classList.contains("cm-list-level-2")).toBe(true);
      expect(lines[3]?.classList.contains("cm-list-level-3")).toBe(true);
    } finally {
      cleanup();
    }
  });

  it("hides raw indentation spaces off active line while preserving document content", () => {
    const doc = "    - Indented item";
    const { view, cleanup } = createEditor(doc, 0, true);
    try {
      const hiddenSpace = view.dom.querySelector(".cm-list-indent-space");
      expect(hiddenSpace).not.toBeNull();
      expect(hiddenSpace?.textContent).toBe("    ");
      expect(view.state.sliceDoc(0, 4)).toBe("    ");
    } finally {
      cleanup();
    }
  });

  it("renders bullet widgets for unordered items and numeral widgets for ordered items", () => {
    const doc = "- Unordered\n1. Ordered";
    const { view, cleanup } = createEditor(doc, 0, true);
    try {
      const bullet = view.dom.querySelector(".cm-list-bullet");
      const ordered = view.dom.querySelector(".cm-list-ordered");
      expect(bullet?.textContent).toBe("•");
      expect(ordered?.textContent).toBe("1.");
    } finally {
      cleanup();
    }
  });

  it("toggles task checkboxes and dispatches transaction updating Markdown", () => {
    const doc = "- [ ] Task to complete";
    const { view, cleanup } = createEditor(doc, 0, true);
    try {
      const checkbox = view.dom.querySelector(
        "input.cm-task-checkbox",
      ) as HTMLInputElement;
      expect(checkbox).not.toBeNull();
      expect(checkbox.checked).toBe(false);

      // Simulate click
      checkbox.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(view.state.doc.toString()).toBe("- [x] Task to complete");
    } finally {
      cleanup();
    }
  });

  it("preserves raw unordered syntax on active editable line per ADR-0068 / ADR-0069", () => {
    const doc = "- Active item";
    // Cursor on line 0 in editable mode
    const { view, cleanup } = createEditor(doc, 5, false);
    try {
      // In editable mode on active line, unordered marker remains raw
      const bulletWidget = view.dom.querySelector(".cm-list-bullet");
      expect(bulletWidget).toBeNull();
      expect(view.dom.textContent).toContain("- Active item");
    } finally {
      cleanup();
    }
  });
});
