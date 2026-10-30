// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NoteCoverImage } from "./NoteCoverImage";

describe("NoteCoverImage", () => {
  it("renders the cover image with resolved src and default position", () => {
    const handleResolve = vi.fn((url: string) => `resolved://${url}`);

    render(
      <NoteCoverImage
        coverUrl="test.jpg"
        coverY={40}
        resolveMediaUrl={handleResolve}
        onChangeCover={vi.fn()}
        onRemoveCover={vi.fn()}
        onSavePosition={vi.fn()}
      />,
    );

    const img = screen.getByRole("img", { name: "Note cover" }) as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.src).toContain("resolved://test.jpg");
    expect(img.style.objectPosition).toBe("center 40%");
  });

  it("calls onChangeCover and onRemoveCover from action buttons", () => {
    const handleChange = vi.fn();
    const handleRemove = vi.fn();

    render(
      <NoteCoverImage
        coverUrl="test.jpg"
        onChangeCover={handleChange}
        onRemoveCover={handleRemove}
        onSavePosition={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Change cover"));
    expect(handleChange).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Remove"));
    expect(handleRemove).toHaveBeenCalled();
  });

  it("enters reposition mode and saves position", () => {
    const handleSave = vi.fn();

    render(
      <NoteCoverImage
        coverUrl="test.jpg"
        coverY={50}
        onChangeCover={vi.fn()}
        onRemoveCover={vi.fn()}
        onSavePosition={handleSave}
      />,
    );

    fireEvent.click(screen.getByText("Reposition"));
    expect(screen.getByText(/Drag up or down to reposition/)).toBeDefined();

    fireEvent.click(screen.getByText("Save position"));
    expect(handleSave).toHaveBeenCalledWith(50);
  });

  it("renders children as overlay when not repositioning", () => {
    render(
      <NoteCoverImage
        coverUrl="test.jpg"
        onChangeCover={vi.fn()}
        onRemoveCover={vi.fn()}
        onSavePosition={vi.fn()}
      >
        <div data-testid="overlay-header">Header Overlay</div>
      </NoteCoverImage>,
    );

    expect(screen.getByTestId("overlay-header")).toBeDefined();
  });
});
