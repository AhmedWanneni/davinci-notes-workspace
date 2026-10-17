// @vitest-environment jsdom
import {
  editorTheme,
  highlightExtension,
  imageExtension,
  insertHardLineBreak,
  linkExtension,
  listIndentKeymap,
  listExtension,
  livePreviewExtension,
  softLineBreakExtension,
  Strikethrough,
  syntaxHighlighting,
  editorHighlightStyle,
} from "@app/editor";
import { markdown } from "@codemirror/lang-markdown";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";

function createListEditor(doc: string, selection = 0) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({
    state: EditorState.create({
      doc,
      selection: EditorSelection.cursor(selection),
      extensions: [
        editorTheme,
        markdown({ extensions: [Strikethrough, highlightExtension] }),
        syntaxHighlighting(editorHighlightStyle),
        livePreviewExtension,
        softLineBreakExtension,
        listExtension(),
        imageExtension(),
        linkExtension({
          notePaths: ["Target.md"],
          sourcePath: "Source.md",
          onLinkClick: () => {},
        }),
      ],
    }),
    parent: container,
  });

  return {
    container,
    view,
    destroy() {
      view.destroy();
      document.body.removeChild(container);
    },
  };
}

describe("List Extension (Phase 5)", () => {
  it("keeps the ordered marker visible during incremental typing of 1. ", () => {
    const { container, view, destroy } = createListEditor("");

    for (const character of "1. ") {
      view.dispatch({
        changes: { from: view.state.doc.length, insert: character },
      });
    }
    const activeText = container.textContent;
    const activeMarker = container.querySelector(".cm-list-ordered");
    view.dispatch({ changes: { from: view.state.doc.length, insert: "item" } });
    const typedText = container.textContent;
    expect(view.state.doc.toString()).toBe("1. item");
    expect(activeText).toContain("1.");
    expect(activeMarker?.textContent).toBe("1.");
    expect(typedText).toContain("1.");
    expect(typedText).toContain("item");
    expect(container.querySelector(".cm-list-ordered")?.textContent).toBe("1.");

    destroy();
  });

  it("renders all bullet markers consistently and retains both ordered delimiters", () => {
    const { container, destroy } = createListEditor(
      "Heading\n- dash\n* star\n+ plus\n1. period\n2. next period\n1) parenthesis\n2) next parenthesis",
    );

    expect(container.querySelectorAll(".cm-list-bullet")).toHaveLength(3);
    expect(
      Array.from(container.querySelectorAll(".cm-list-bullet")).map(
        (marker) => marker.textContent,
      ),
    ).toEqual(["•", "•", "•"]);
    expect(
      Array.from(container.querySelectorAll(".cm-list-ordered")).map(
        (marker) => marker.textContent,
      ),
    ).toEqual(["1.", "2.", "1)", "2)"]);

    destroy();
  });

  it("renders every non-space task marker as completed and toggles Markdown through a transaction", () => {
    const { container, view, destroy } = createListEditor(
      "Heading\n- [ ] open\n- [x] done\n- [?] waiting\n- [-] skipped",
    );
    const tasks =
      container.querySelectorAll<HTMLInputElement>(".cm-task-checkbox");

    expect(tasks).toHaveLength(4);
    expect(Array.from(tasks).map((task) => task.checked)).toEqual([
      false,
      true,
      true,
      true,
    ]);
    expect(container.querySelectorAll(".cm-task-completed")).toHaveLength(3);

    tasks[0].click();
    expect(view.state.doc.toString()).toContain("- [x] open");

    const refreshedTasks =
      container.querySelectorAll<HTMLInputElement>(".cm-task-checkbox");
    refreshedTasks[1].click();
    expect(view.state.doc.toString()).toContain("- [ ] done");

    destroy();
  });

  it("renders disabled task controls in the shared read-only path", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const view = new EditorView({
      state: EditorState.create({
        doc: "- [?] read-only task",
        extensions: [
          editorTheme,
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
          listExtension({ isReadOnly: true }),
        ],
      }),
      parent: container,
    });

    const checkbox =
      container.querySelector<HTMLInputElement>(".cm-task-checkbox");
    expect(checkbox?.checked).toBe(true);
    expect(checkbox?.disabled).toBe(true);

    view.destroy();
    document.body.removeChild(container);
  });

  it("supports deeply mixed nesting and Phase 2–4 content inside list items", () => {
    const doc = [
      "Heading",
      "- **outer** [[Target]]",
      "  1. [ ] *nested* [link](https://example.com)",
      "     - [?] ![Photo|100](https://example.com/photo.png)",
      "       + soft",
      "         continuation",
    ].join("\n");
    const { container, destroy } = createListEditor(doc);

    expect(container.querySelectorAll(".cm-list-bullet")).toHaveLength(3);
    expect(container.querySelectorAll(".cm-list-ordered")).toHaveLength(1);
    expect(container.querySelectorAll(".cm-task-checkbox")).toHaveLength(2);
    expect(container.querySelector(".cm-wikilink")?.textContent).toBe("Target");
    expect(container.querySelector(".cm-link-external")?.textContent).toBe(
      "link",
    );
    expect(container.querySelector(".cm-image-embed")).not.toBeNull();
    expect(container.querySelector(".cm-soft-line-break")).not.toBeNull();

    destroy();
  });

  it("uses CodeMirror's existing Tab bindings for single and multi-item indentation", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const view = new EditorView({
      state: EditorState.create({
        doc: "- first\n- second\n- third",
        selection: EditorSelection.range(0, 15),
        extensions: [markdown()],
      }),
      parent: container,
    });

    expect(listIndentKeymap[0].run!(view)).toBe(true);
    expect(view.state.doc.toString()).toBe("  - first\n  - second\n- third");

    expect(listIndentKeymap[0].shift!(view)).toBe(true);
    expect(view.state.doc.toString()).toBe("- first\n- second\n- third");

    view.destroy();
    document.body.removeChild(container);
  });

  it("keeps Shift+Enter within an ordered item by indenting its continuation", () => {
    const state = EditorState.create({
      doc: "  12) alpha",
      selection: EditorSelection.cursor(9),
    });
    let nextState = state;

    expect(
      insertHardLineBreak({
        state,
        dispatch: (transaction) => {
          nextState = transaction.state;
        },
      }),
    ).toBe(true);
    expect(nextState.doc.toString()).toBe("  12) alp  \n      ha");

    const periodState = EditorState.create({
      doc: "1. item",
      selection: EditorSelection.cursor(4),
    });
    let nextPeriodState = periodState;
    insertHardLineBreak({
      state: periodState,
      dispatch: (transaction) => {
        nextPeriodState = transaction.state;
      },
    });
    expect(nextPeriodState.doc.toString()).toBe("1. i  \n   tem");
  });
});
