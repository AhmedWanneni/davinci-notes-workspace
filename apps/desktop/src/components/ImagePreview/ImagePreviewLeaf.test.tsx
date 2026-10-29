// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TooltipProvider } from "@app/design-system";
import { setPlatformAdapters } from "@app/platform-adapters";
import { ImagePreviewLeaf } from "./ImagePreviewLeaf";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import * as vaultCommands from "../../vault/vaultCommands";

describe("ImagePreviewLeaf", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useWorkspaceStore.setState({
      vaultPath: "/test/vault",
    });

    setPlatformAdapters({
      fs: {
        resolveFileUrl: (p: string) => `asset://localhost${p}`,
      },
    } as Parameters<typeof setPlatformAdapters>[0]);

    vi.spyOn(vaultCommands, "statNote").mockResolvedValue({
      exists: true,
      size: 1048576,
      mtime: 12345678,
    });
  });

  it("renders image with resolved URL and file name in info bar", () => {
    render(
      <TooltipProvider>
        <ImagePreviewLeaf path="images/screenshot.png" />
      </TooltipProvider>,
    );

    const img = screen.getByRole("img", { name: "screenshot.png" });
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe(
      "asset://localhost/test/vault/images/screenshot.png",
    );

    expect(screen.getByText("screenshot.png")).not.toBeNull();
    expect(screen.getByText("100%")).not.toBeNull();
  });

  it("adjusts zoom percentage when zoom in and zoom out buttons are clicked", () => {
    render(
      <TooltipProvider>
        <ImagePreviewLeaf path="images/diagram.png" />
      </TooltipProvider>,
    );

    const zoomInBtn = screen.getByRole("button", { name: "Zoom in" });
    const zoomOutBtn = screen.getByRole("button", { name: "Zoom out" });
    const resetBtn = screen.getByRole("button", { name: "Reset zoom" });

    // Initial zoom 100%
    expect(screen.getByText("100%")).not.toBeNull();

    // Zoom in -> 125%
    fireEvent.click(zoomInBtn);
    expect(screen.getByText("125%")).not.toBeNull();

    // Zoom out twice -> 100% then 75%
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText("100%")).not.toBeNull();
    fireEvent.click(zoomOutBtn);
    expect(screen.getByText("75%")).not.toBeNull();

    // Reset zoom -> 100%
    fireEvent.click(resetBtn);
    expect(screen.getByText("100%")).not.toBeNull();
  });

  it("calls onClose when the close toolbar button is clicked", () => {
    const onClose = vi.fn();
    render(
      <TooltipProvider>
        <ImagePreviewLeaf path="images/photo.jpg" onClose={onClose} />
      </TooltipProvider>,
    );

    const closeBtn = screen.getByRole("button", { name: "Close preview" });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
