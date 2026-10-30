import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CanvasBottomDock } from "./CanvasBottomDock";

describe("CanvasBottomDock", () => {
  it("renders creation tools and triggers text card creation", () => {
    const onCreateTextCard = vi.fn();
    const onCreateFileCard = vi.fn();

    render(
      <CanvasBottomDock
        allNotePaths={["Note A.md", "Folder/Note B.md"]}
        onCreateTextCard={onCreateTextCard}
        onCreateFileCard={onCreateFileCard}
      />,
    );

    const textBtn = screen.getByLabelText("Add Text Card");
    expect(textBtn).toBeDefined();
    fireEvent.click(textBtn);
    expect(onCreateTextCard).toHaveBeenCalledTimes(1);

    const noteBtn = screen.getByLabelText("Add note from vault");
    expect(noteBtn).toBeDefined();
    fireEvent.click(noteBtn);

    const noteItem = screen.getByText("Note A.md");
    expect(noteItem).toBeDefined();
    fireEvent.click(noteItem);
    expect(onCreateFileCard).toHaveBeenCalledWith("Note A.md");
  });

  it("handles media picker button", async () => {
    const onPickMedia = vi.fn().mockResolvedValue("attachments/photo.png");
    const onCreateFileCard = vi.fn();

    render(
      <CanvasBottomDock
        allNotePaths={[]}
        onCreateTextCard={vi.fn()}
        onCreateFileCard={onCreateFileCard}
        onPickMedia={onPickMedia}
      />,
    );

    const mediaBtn = screen.getByLabelText("Add media");
    fireEvent.click(mediaBtn);
    await vi.waitFor(() => {
      expect(onPickMedia).toHaveBeenCalledTimes(1);
      expect(onCreateFileCard).toHaveBeenCalledWith("attachments/photo.png");
    });
  });
});
