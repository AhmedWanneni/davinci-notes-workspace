// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { InsertDialog } from "./InsertDialog";
import { findInsertItem } from "@app/editor";
import type { InsertDialogRequest } from "@app/editor";

function createDummyRequest(itemId: string): InsertDialogRequest {
  const item = findInsertItem(itemId)!;
  const state = EditorState.create({ doc: "test" });
  const view = new EditorView({ state });
  return {
    item,
    view,
    selection: state.selection,
  };
}

describe("InsertDialog", () => {
  it("renders nothing when request is null", () => {
    const { container } = render(
      <InsertDialog
        request={null}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders YouTube dialog and rejects invalid URLs with inline error", () => {
    const request = createDummyRequest("youtube");
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <InsertDialog
        request={request}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByText("Insert YouTube Video")).not.toBeNull();
    const input = screen.getByPlaceholderText("https://www.youtube.com/watch?v=...");
    expect(input).not.toBeNull();

    // Submit with invalid input (Shorts)
    fireEvent.change(input, {
      target: { value: "https://www.youtube.com/shorts/dQw4w9WgXcQ" },
    });
    fireEvent.click(screen.getByText("Insert Video"));

    expect(screen.getByText("YouTube Shorts are not supported.")).not.toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();

    // Submit with valid input
    fireEvent.change(input, {
      target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    fireEvent.click(screen.getByText("Insert Video"));

    expect(onConfirm).toHaveBeenCalledWith({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
  });

  it("confirms on Enter and cancels on Escape or Cancel button", () => {
    const request = createDummyRequest("tweet");
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { rerender } = render(
      <InsertDialog
        request={request}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    const input = screen.getByPlaceholderText("https://x.com/username/status/...");
    fireEvent.change(input, {
      target: { value: "https://x.com/jack/status/20" },
    });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onConfirm).toHaveBeenCalledWith({
      url: "https://x.com/jack/status/20",
    });

    // Test cancel
    rerender(
      <InsertDialog
        request={request}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("handles Image dialog tabs and file picking", async () => {
    const request = createDummyRequest("image");
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onPickLocalFile = vi.fn().mockResolvedValue("attachments/photo.png");

    render(
      <InsertDialog
        request={request}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onPickLocalFile={onPickLocalFile}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Insert Image" }),
    ).not.toBeNull();
    expect(screen.getByText("Local file")).not.toBeNull();
    expect(screen.getByText("URL")).not.toBeNull();

    // Click pick file button
    fireEvent.click(screen.getByText("Choose image file..."));
    await vi.waitFor(() => {
      expect(screen.getByText("Imported: attachments/photo.png")).not.toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "Insert Image" }));
    expect(onConfirm).toHaveBeenCalledWith({
      path: "attachments/photo.png",
    });
  });
});
