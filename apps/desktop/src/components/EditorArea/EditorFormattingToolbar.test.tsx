// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { history } from "@app/editor";
import { EditorFormattingToolbar } from "./EditorFormattingToolbar";

if (typeof Range !== "undefined" && !Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
}

function createTestView(doc = "sample text") {
  const state = EditorState.create({
    doc,
    selection: { anchor: 0, head: 6 },
    extensions: [history()],
  });
  return new EditorView({ state });
}

describe("EditorFormattingToolbar", () => {
  it("renders toolbar with buttons and select options", () => {
    const view = createTestView();
    render(<EditorFormattingToolbar view={view} />);

    expect(screen.getByRole("toolbar")).toBeDefined();
    expect(screen.getByRole("button", { name: "Bold" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Italic" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Underline" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Strikethrough" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Highlight" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Inline Code" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Link" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Insert Image" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Table" })).toBeDefined();
    expect(screen.getByRole("combobox", { name: "Text style" })).toBeDefined();
    view.destroy();
  });

  it("triggers bold formatting when clicking Bold button", () => {
    const view = createTestView("hello world");
    view.dispatch({ selection: { anchor: 6, head: 11 } });
    render(<EditorFormattingToolbar view={view} />);

    const boldBtn = screen.getByRole("button", { name: "Bold" });
    fireEvent.click(boldBtn);

    expect(view.state.doc.toString()).toBe("hello **world**");
    view.destroy();
  });

  it("calls onOpenInsertMenu when clicking Insert button", () => {
    const view = createTestView();
    const handleInsert = vi.fn();
    render(
      <EditorFormattingToolbar view={view} onOpenInsertMenu={handleInsert} />,
    );

    const insertBtn = screen.getByRole("button", { name: "Insert More" });
    fireEvent.click(insertBtn);

    expect(handleInsert).toHaveBeenCalledTimes(1);
    view.destroy();
  });

  it("calls onOpenImagePicker when clicking Insert Image button", () => {
    const view = createTestView();
    const handleImagePicker = vi.fn();
    render(
      <EditorFormattingToolbar
        view={view}
        onOpenImagePicker={handleImagePicker}
      />,
    );

    const imgBtn = screen.getByRole("button", { name: "Insert Image" });
    fireEvent.click(imgBtn);

    expect(handleImagePicker).toHaveBeenCalledTimes(1);
    view.destroy();
  });

  it("changes heading level via dropdown", () => {
    const view = createTestView("Heading text");
    view.dispatch({ selection: { anchor: 0, head: 0 } });
    render(<EditorFormattingToolbar view={view} />);

    const select = screen.getByRole("combobox", { name: "Text style" });
    fireEvent.change(select, { target: { value: "2" } });

    expect(view.state.doc.toString()).toBe("## Heading text");
    view.destroy();
  });

  it("opens TableGridPopover when clicking Table button and inserts custom table", () => {
    const view = createTestView();
    render(<EditorFormattingToolbar view={view} />);

    const tableBtn = screen.getByRole("button", { name: "Table" });
    fireEvent.click(tableBtn);

    const cell = screen.getByTestId("grid-cell-2-2");
    expect(cell).toBeDefined();

    fireEvent.click(cell);

    expect(view.state.doc.toString()).toContain("| Header 1 | Header 2 |");
    expect(
      screen.queryByRole("grid", { name: "Table dimension picker" }),
    ).toBeNull();
    view.destroy();
  });
});
