// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorConflictBanner } from "./EditorConflictBanner";

describe("EditorConflictBanner", () => {
  it("renders the banner with note filename and action buttons", () => {
    const onKeepMine = vi.fn();
    const onUseDisk = vi.fn();
    const onSaveCopy = vi.fn();

    render(
      <EditorConflictBanner
        path="folder/important.md"
        onKeepMine={onKeepMine}
        onUseDisk={onUseDisk}
        onSaveCopy={onSaveCopy}
      />,
    );

    expect(screen.getByTestId("editor-conflict-banner")).toBeTruthy();
    expect(screen.getByText(/important\.md/)).toBeTruthy();

    fireEvent.click(screen.getByText("Save mine as a copy"));
    expect(onSaveCopy).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByText("Use the disk version"));
    expect(onUseDisk).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByText("Keep my version"));
    expect(onKeepMine).toHaveBeenCalledOnce();
  });
});
