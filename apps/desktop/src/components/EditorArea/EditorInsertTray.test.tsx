// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { EditorInsertTray } from "./EditorInsertTray";

function createMockEditorView(doc = ""): EditorView {
  const container = document.createElement("div");
  const state = EditorState.create({ doc });
  return new EditorView({ state, parent: container });
}

describe("EditorInsertTray", () => {
  it("renders all category tabs and catalog cards by default", () => {
    const view = createMockEditorView("hello");
    render(<EditorInsertTray view={view} onClose={vi.fn()} />);

    expect(
      screen.getByRole("region", { name: "Editor insert tray" }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "All" })).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Mermaid Diagrams" }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Tables" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Callouts" })).toBeDefined();

    // Check sample cards
    expect(screen.getByText("Flowchart (Left to Right)")).toBeDefined();
    expect(screen.getByText("3x3 Table")).toBeDefined();
    expect(screen.getByText("Note Callout")).toBeDefined();
  });

  it("filters items when clicking a category tab", () => {
    const view = createMockEditorView("hello");
    render(<EditorInsertTray view={view} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Tables" }));

    expect(screen.getByText("3x3 Table")).toBeDefined();
    expect(screen.getByText("Comparison Table")).toBeDefined();
    expect(screen.queryByText("Flowchart (Left to Right)")).toBeNull();

    // Verify Custom Table grid picker is rendered in Tables category
    expect(
      screen.getByText(
        "Custom Size Table (Drag or click to choose dimensions):",
      ),
    ).toBeDefined();
    expect(
      screen.getByRole("grid", { name: "Table dimension picker" }),
    ).toBeDefined();
  });

  it("inserts the selected snippet into CodeMirror when a card is clicked", () => {
    const view = createMockEditorView("");
    const dispatchSpy = vi.spyOn(view, "dispatch");

    render(<EditorInsertTray view={view} onClose={vi.fn()} />);

    const tableCard = screen.getByText("3x3 Table");
    fireEvent.click(tableCard);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const callArgs = dispatchSpy.mock.calls[0][0];
    expect(callArgs).toBeDefined();
    expect(view.state.doc.toString()).toContain(
      "| Header 1 | Header 2 | Header 3 |",
    );
  });

  it("triggers onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    const view = createMockEditorView("");
    render(<EditorInsertTray view={view} onClose={onClose} />);

    const closeBtn = screen.getByRole("button", { name: "Close insert tray" });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("triggers onOpenImagePicker when upload image is clicked", () => {
    const onOpenImagePicker = vi.fn();
    const view = createMockEditorView("");
    render(
      <EditorInsertTray
        view={view}
        onClose={vi.fn()}
        onOpenImagePicker={onOpenImagePicker}
      />,
    );

    const uploadBtn = screen.getByText("Upload Image...");
    fireEvent.click(uploadBtn);

    expect(onOpenImagePicker).toHaveBeenCalledTimes(1);
  });
});
