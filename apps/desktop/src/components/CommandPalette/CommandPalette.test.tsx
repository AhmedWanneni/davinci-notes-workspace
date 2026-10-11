// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { CommandPalette } from "./CommandPalette";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { getRecentInsertIds, clearRecentInserts } from "@app/editor";

function createTestView(doc = "initial text", editable = true) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const state = EditorState.create({
    doc,
    selection: { anchor: 7 },
    extensions: [EditorView.editable.of(editable)],
  });
  const view = new EditorView({ state, parent: container });
  return {
    view,
    destroy: () => {
      view.destroy();
      container.remove();
    },
  };
}

describe("CommandPalette escape hatch for Vim keybindings", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      allNotePaths: ["NoteA.md"],
      openNotes: [],
      useVimMode: false,
    });
  });

  it("does not display 'Disable Vim keybindings' when useVimMode is false", () => {
    render(
      <CommandPalette
        isOpen={true}
        onOpenChange={() => {}}
        onSelectNote={() => {}}
      />,
    );

    expect(screen.queryByText("Disable Vim keybindings")).toBeNull();
  });

  it("displays 'Disable Vim keybindings' when useVimMode is true and disables Vim mode on selection", () => {
    useWorkspaceStore.setState({ useVimMode: true });

    render(
      <CommandPalette
        isOpen={true}
        onOpenChange={() => {}}
        onSelectNote={() => {}}
      />,
    );

    const disableItem = screen.getByText("Disable Vim keybindings");
    expect(disableItem).not.toBeNull();

    fireEvent.click(disableItem);

    expect(useWorkspaceStore.getState().useVimMode).toBe(false);
  });

  it("runs the explicit save-version action", () => {
    const saveVersionNow = vi.fn();
    render(
      <CommandPalette
        isOpen={true}
        onOpenChange={() => {}}
        onSelectNote={() => {}}
        onSaveVersionNow={saveVersionNow}
      />,
    );

    fireEvent.click(screen.getByText("Save version now"));

    expect(saveVersionNow).toHaveBeenCalledOnce();
  });
});

describe("CommandPalette Insert Registry Commands", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      allNotePaths: [],
      openNotes: [],
      useVimMode: false,
    });
  });

  it("generates Insert commands when an editable editor is provided and inserts at cursor", () => {
    const { view, destroy } = createTestView("hello world", true);
    view.dispatch({ selection: { anchor: 5 } });

    render(
      <CommandPalette
        isOpen={true}
        onOpenChange={() => {}}
        onSelectNote={() => {}}
        editorView={view}
      />,
    );

    const headingCmd = screen.getByText("Insert: Heading 1");
    expect(headingCmd).not.toBeNull();

    fireEvent.click(headingCmd);

    expect(view.state.doc.toString()).toContain("# ");
    destroy();
  });

  it("hides insert commands when no editor is focused or editor is read-only", () => {
    const { view: readOnlyView, destroy } = createTestView("content", false);

    const { rerender } = render(
      <CommandPalette
        isOpen={true}
        onOpenChange={() => {}}
        onSelectNote={() => {}}
        editorView={null}
      />,
    );

    expect(screen.queryByText("Insert: Heading 1")).toBeNull();

    rerender(
      <CommandPalette
        isOpen={true}
        onOpenChange={() => {}}
        onSelectNote={() => {}}
        editorView={readOnlyView}
      />,
    );

    expect(screen.queryByText("Insert: Heading 1")).toBeNull();
    destroy();
  });

  it("closing the palette does not lose editor selection", () => {
    const { view, destroy } = createTestView("some text", true);
    view.dispatch({ selection: { anchor: 4, head: 8 } });
    const originalSelection = { ...view.state.selection.main };

    const onOpenChange = vi.fn();
    const { rerender } = render(
      <CommandPalette
        isOpen={true}
        onOpenChange={onOpenChange}
        onSelectNote={() => {}}
        editorView={view}
      />,
    );

    // Close palette
    rerender(
      <CommandPalette
        isOpen={false}
        onOpenChange={onOpenChange}
        onSelectNote={() => {}}
        editorView={view}
      />,
    );

    expect(view.state.selection.main.from).toBe(originalSelection.from);
    expect(view.state.selection.main.to).toBe(originalSelection.to);
    destroy();
  });

  it("records recent insert to shared store and boosts it in command palette", () => {
    clearRecentInserts();
    const { view, destroy } = createTestView("hello world", true);
    view.dispatch({ selection: { anchor: 5 } });

    render(
      <CommandPalette
        isOpen={true}
        onOpenChange={() => {}}
        onSelectNote={() => {}}
        editorView={view}
      />,
    );

    const calloutCmd = screen.getByText("Insert: Callout");
    fireEvent.click(calloutCmd);

    expect(getRecentInsertIds()).toContain("callout");
    destroy();
  });
});
