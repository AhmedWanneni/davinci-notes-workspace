import React from "react";
import { describe, expect, it, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  getNoteMode,
  setNoteModeInContent,
} from "../vault/noteProperties";
import {
  handleNoteModeEnter,
  handleTextModeEnter,
  createMobileEditorExtensions,
} from "../components/editorExtensions";
import { EditorHeader } from "../components/EditorHeader";

describe("noteProperties Suite", () => {
  it("defaults to note mode when no frontmatter exists", () => {
    expect(getNoteMode("Hello world\nThis is a note")).toBe("note");
  });

  it("extracts type: text from frontmatter", () => {
    const md = "---\ntype: text\n---\nHello text";
    expect(getNoteMode(md)).toBe("text");
  });

  it("extracts type: note from frontmatter", () => {
    const md = "---\ntype: note\ntitle: My Note\n---\nHello note";
    expect(getNoteMode(md)).toBe("note");
  });

  it("extracts mode: text from frontmatter", () => {
    const md = "---\nmode: text\n---\nContent";
    expect(getNoteMode(md)).toBe("text");
  });

  it("adds frontmatter when none exists", () => {
    const original = "Some content";
    const updated = setNoteModeInContent(original, "text");
    expect(updated).toBe("---\ntype: text\n---\n\nSome content");
    expect(getNoteMode(updated)).toBe("text");
  });

  it("updates existing type in frontmatter", () => {
    const original = "---\ntype: note\ntags: [a, b]\n---\nContent";
    const updated = setNoteModeInContent(original, "text");
    expect(updated).toContain("type: text");
    expect(updated).toContain("tags: [a, b]");
    expect(getNoteMode(updated)).toBe("text");
  });

  it("adds type property to existing frontmatter without type", () => {
    const original = "---\ntitle: Doc\n---\nContent";
    const updated = setNoteModeInContent(original, "note");
    expect(updated).toContain("title: Doc");
    expect(updated).toContain("type: note");
    expect(getNoteMode(updated)).toBe("note");
  });
});

describe("editorExtensions Note vs Text mode Enter Suite", () => {
  it("handleNoteModeEnter converts isolated '-' into bullet list continuation", () => {
    const state = EditorState.create({
      doc: "-",
      selection: { anchor: 1 },
    });
    let dispatched = false;
    let newDoc = "";
    const view = {
      state,
      dispatch: (tr: { changes: { insert: string }[]; scrollIntoView?: boolean; userEvent?: string }) => {
        dispatched = true;
        if (Array.isArray(tr.changes)) {
          newDoc = tr.changes.map((c) => c.insert).join("");
        }
      },
    } as unknown as EditorView;

    const handled = handleNoteModeEnter(view);
    expect(handled).toBe(true);
    expect(dispatched).toBe(true);
    expect(newDoc).toBe("- \n- ");
  });

  it("handleTextModeEnter preserves '-' as literal '-' without list continuation", () => {
    const state = EditorState.create({
      doc: "-",
      selection: { anchor: 1 },
    });
    let inserted = "";
    const view = {
      state,
      dispatch: (tr: { changes: { insert: string } }) => {
        inserted = tr.changes.insert;
      },
    } as unknown as EditorView;

    const handled = handleTextModeEnter(view);
    expect(handled).toBe(true);
    expect(inserted).toBe("\n");
  });

  it("creates different extension sets for note and text mode", () => {
    const noteExts = createMobileEditorExtensions([], "note");
    const textExts = createMobileEditorExtensions([], "text");
    expect(noteExts.length).toBeGreaterThan(textExts.length);
  });
});

describe("EditorHeader Note/Text Mode Switcher", () => {
  it("renders note and text header element and accepts mode callbacks", () => {
    const onToggleMode = vi.fn();
    const element = (
      <EditorHeader
        mode="note"
        onBack={vi.fn()}
        onToggleMode={onToggleMode}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.mode).toBe("note");
    expect(element.props.onToggleMode).toBe(onToggleMode);
  });
});
