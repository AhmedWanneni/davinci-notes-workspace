import { describe, it, expect, vi } from "vitest";
import React from "react";
import { DateTimePickerModal } from "../components/todos/DateTimePickerModal";
import { stripLeadingH1Title } from "../vault/useEditorNoteLoader";
import { EditorTitleHeader } from "../components/EditorTitleHeader";

describe("stripLeadingH1Title", () => {
  it("strips # Title from regular note", () => {
    const raw = "# My Note\nBody text here";
    expect(stripLeadingH1Title(raw, false)).toBe("Body text here");
  });

  it("strips ## Heading from todo note", () => {
    const raw = "## Daily routine\n- [ ] Task 1\n- [ ] Task 2\n";
    expect(stripLeadingH1Title(raw, true)).toBe("- [ ] Task 1\n- [ ] Task 2\n");
  });

  it("strips # Todo Header from todo note with frontmatter", () => {
    const raw = "---\ntitle: Daily\n---\n# My Todos\n- [ ] Task 1\n";
    expect(stripLeadingH1Title(raw, true)).toBe("---\ntitle: Daily\n---\n- [ ] Task 1\n");
  });
});

describe("DateTimePickerModal", () => {
  it("creates DateTimePickerModal element with confirm and close props", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    const modal = (
      <DateTimePickerModal visible={true} onClose={onClose} onConfirm={onConfirm} />
    );

    expect(modal).toBeDefined();
    expect(modal.props.visible).toBe(true);
    expect(modal.props.onConfirm).toBe(onConfirm);
    expect(modal.props.onClose).toBe(onClose);
  });
});

describe("EditorTitleHeader", () => {
  it("creates EditorTitleHeader element with path and callback", () => {
    const onPathChange = vi.fn();
    const header = (
      <EditorTitleHeader
        activePath="Notes/Work.md"
        onPathChange={onPathChange}
        textColor="#000000"
      />
    );

    expect(header).toBeDefined();
    expect(header.props.activePath).toBe("Notes/Work.md");
    expect(header.props.textColor).toBe("#000000");
  });
});
