// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CoverImagePickerModal } from "./CoverImagePickerModal";

describe("CoverImagePickerModal", () => {
  it("renders presets and triggers onSelectCover on clicking a card", () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <CoverImagePickerModal
        onSelectCover={handleSelect}
        onClose={handleClose}
      />,
    );

    expect(screen.getByText("Cover Image")).toBeDefined();
    expect(screen.getByText("Alice in Wonderland")).toBeDefined();

    fireEvent.click(screen.getByText("Alice in Wonderland"));
    expect(handleSelect).toHaveBeenCalledWith(
      expect.stringContaining("unsplash.com"),
      50,
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it("switches to link tab and applies custom URL", () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    render(
      <CoverImagePickerModal
        onSelectCover={handleSelect}
        onClose={handleClose}
      />,
    );

    fireEvent.click(screen.getByText("Link"));
    const input = screen.getByPlaceholderText(
      "Paste an image link (e.g. Unsplash URL)...",
    );
    fireEvent.change(input, {
      target: { value: "https://example.com/custom.jpg" },
    });

    fireEvent.click(screen.getByText("Apply"));
    expect(handleSelect).toHaveBeenCalledWith(
      "https://example.com/custom.jpg",
      50,
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it("renders remove cover button when currentCover is present", () => {
    const handleRemove = vi.fn();
    const handleClose = vi.fn();

    render(
      <CoverImagePickerModal
        currentCover="existing.jpg"
        onSelectCover={vi.fn()}
        onRemoveCover={handleRemove}
        onClose={handleClose}
      />,
    );

    const removeBtn = screen.getByText("Remove Cover");
    expect(removeBtn).toBeDefined();
    fireEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });
});
