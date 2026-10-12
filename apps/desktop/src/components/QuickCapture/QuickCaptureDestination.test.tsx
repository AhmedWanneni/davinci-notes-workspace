// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuickCaptureDestination } from "./QuickCaptureDestination";

describe("QuickCaptureDestination", () => {
  it("renders filename and folder inputs with accessible labels", () => {
    render(
      <QuickCaptureDestination
        filename=""
        onFilenameChange={vi.fn()}
        folder=""
        onFolderChange={vi.fn()}
        onSave={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByRole("textbox", { name: /note name/i })).toBeDefined();
    expect(
      screen.getByRole("combobox", { name: /note folder/i }),
    ).toBeDefined();
  });

  it("calls onFilenameChange when user types in name field", () => {
    const handleNameChange = vi.fn();
    render(
      <QuickCaptureDestination
        filename=""
        onFilenameChange={handleNameChange}
        folder=""
        onFolderChange={vi.fn()}
        onSave={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    const input = screen.getByRole("textbox", { name: /note name/i });
    fireEvent.change(input, { target: { value: "My Meeting" } });

    expect(handleNameChange).toHaveBeenCalledWith("My Meeting");
  });

  it("submits on Enter inside filename input", () => {
    const handleSave = vi.fn();
    render(
      <QuickCaptureDestination
        filename="My Note"
        onFilenameChange={vi.fn()}
        folder=""
        onFolderChange={vi.fn()}
        onSave={handleSave}
        onDismiss={vi.fn()}
      />,
    );

    const input = screen.getByRole("textbox", { name: /note name/i });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(handleSave).toHaveBeenCalled();
  });

  it("submits on Enter inside folder input when dropdown is closed", () => {
    const handleSave = vi.fn();
    render(
      <QuickCaptureDestination
        filename="My Note"
        onFilenameChange={vi.fn()}
        folder="work"
        onFolderChange={vi.fn()}
        onSave={handleSave}
        onDismiss={vi.fn()}
      />,
    );

    const input = screen.getByRole("combobox", { name: /note folder/i });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(handleSave).toHaveBeenCalled();
  });

  it("dismisses on Escape", () => {
    const handleDismiss = vi.fn();
    render(
      <QuickCaptureDestination
        filename=""
        onFilenameChange={vi.fn()}
        folder=""
        onFolderChange={vi.fn()}
        onSave={vi.fn()}
        onDismiss={handleDismiss}
      />,
    );

    const input = screen.getByRole("textbox", { name: /note name/i });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(handleDismiss).toHaveBeenCalled();
  });
});
