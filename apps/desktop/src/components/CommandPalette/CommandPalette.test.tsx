// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommandPalette } from "./CommandPalette";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

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
