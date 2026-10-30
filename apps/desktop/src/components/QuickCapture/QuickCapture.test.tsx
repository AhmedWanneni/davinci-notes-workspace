// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuickCapture } from "./QuickCapture";

describe("QuickCapture", () => {
  it("renders textarea, counter, keyboard hints, and record button", () => {
    render(<QuickCapture />);

    expect(
      screen.getByRole("textbox", { name: /quick capture text/i }),
    ).toBeDefined();
    expect(screen.getByText(/0 \/ 10000/)).toBeDefined();
    expect(screen.getByRole("button", { name: /save note/i })).toBeDefined();
    expect(
      screen.getByRole("button", { name: /start recording/i }),
    ).toBeDefined();
    expect(
      screen.getAllByRole("button", { name: /close quick capture/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /quit application/i }).length,
    ).toBeGreaterThan(0);
  });

  it("switches to record mode when Record button is clicked", async () => {
    render(<QuickCapture />);
    fireEvent.click(screen.getByRole("button", { name: /start recording/i }));
    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: /voice recording section/i }),
      ).toBeDefined();
    });
  });

  it("submits on Cmd+S and clears input", async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onSave={handleSave} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "My captured note" } });

    fireEvent.keyDown(textarea, { key: "s", metaKey: true });

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith("My captured note");
    });
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("saves on clicking the Save note button", async () => {
    const handleSave = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onSave={handleSave} />);

    const saveButton = screen.getByRole("button", { name: /save note/i });
    expect((saveButton as HTMLButtonElement).disabled).toBe(true);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "Saved via button" } });

    expect((saveButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(handleSave).toHaveBeenCalledWith("Saved via button");
    });
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("does not submit on Enter without modifier (allows multiline typing)", () => {
    const handleSave = vi.fn();
    render(<QuickCapture onSave={handleSave} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "Line one" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
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
    expect((textarea as HTMLTextAreaElement).value).toBe("Unsaved text");
  });

  it("dismisses on clicking the Close button", async () => {
    const handleDismiss = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onDismiss={handleDismiss} />);

    const closeButtons = screen.getAllByRole("button", {
      name: /close quick capture/i,
    });
    expect(closeButtons.length).toBeGreaterThan(0);
    fireEvent.click(closeButtons[0]);

    await waitFor(() => {
      expect(handleDismiss).toHaveBeenCalled();
    });
  });

  it("quits application on clicking Quit button", async () => {
    const handleQuit = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onQuit={handleQuit} />);

    const quitButtons = screen.getAllByRole("button", {
      name: /quit application/i,
    });
    expect(quitButtons.length).toBeGreaterThan(0);
    fireEvent.click(quitButtons[0]);

    await waitFor(() => {
      expect(handleQuit).toHaveBeenCalled();
    });
  });

  it("quits application on Cmd+Q shortcut", async () => {
    const handleQuit = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onQuit={handleQuit} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.keyDown(textarea, { key: "q", metaKey: true });

    await waitFor(() => {
      expect(handleQuit).toHaveBeenCalled();
    });
  });

  it("dismisses silently when save is triggered on empty/whitespace text", async () => {
    const handleSave = vi.fn();
    const handleDismiss = vi.fn().mockResolvedValue(undefined);
    render(<QuickCapture onSave={handleSave} onDismiss={handleDismiss} />);

    const textarea = screen.getByRole("textbox", {
      name: /quick capture text/i,
    });
    fireEvent.change(textarea, { target: { value: "   " } });

    fireEvent.keyDown(textarea, { key: "s", metaKey: true });

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
    fireEvent.keyDown(textarea, { key: "s", metaKey: true });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
      expect(screen.getByText("Vault not found error")).toBeDefined();
    });
  });
});
