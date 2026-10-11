// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuickCapture } from "./QuickCapture";

describe("QuickCapture", () => {
  it("renders textarea, counter, and keyboard hints", () => {
    render(<QuickCapture />);

    expect(
      screen.getByRole("textbox", { name: /quick capture text/i }),
    ).toBeDefined();
    expect(screen.getByText(/0 \/ 10000/)).toBeDefined();
    expect(screen.getByText(/Save/i)).toBeDefined();
    expect(screen.getByText(/Dismiss/i)).toBeDefined();
  });

  it("submits on Enter without shift and clears input", async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onSave={handleSave} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "My captured note" } });

    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith("My captured note");
    });
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("does not submit on Shift+Enter (allows multiline typing)", () => {
    const handleSave = vi.fn();
    render(<QuickCapture onSave={handleSave} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "Line one" } });

    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    expect(handleSave).not.toHaveBeenCalled();
  });

  it("dismisses on Escape", async () => {
    const handleDismiss = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onDismiss={handleDismiss} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "Unsaved text" } });

    fireEvent.keyDown(textarea, { key: "Escape" });

    await waitFor(() => {
      expect(handleDismiss).toHaveBeenCalled();
    });
  });

  it("dismisses silently when Enter is pressed on empty/whitespace text", async () => {
    const handleSave = vi.fn();
    const handleDismiss = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onSave={handleSave} onDismiss={handleDismiss} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "   " } });

    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(handleDismiss).toHaveBeenCalled();
    });
    expect(handleSave).not.toHaveBeenCalled();
  });

  it("displays error message when save fails", async () => {
    const handleSave = vi.fn().mockRejectedValue("Vault not found error");
    render(<QuickCapture onSave={handleSave} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "Failed note" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText("Vault not found error")).toBeDefined();
    });
  });
});
