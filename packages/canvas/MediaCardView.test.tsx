import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CanvasEditorContext } from "./CanvasEditorContext";
import { MediaCardView } from "./MediaCardView";
import {
  generatePastedMediaFilename,
  getFileCardType,
  isMediaFile,
} from "./mediaCardUtils";

describe("mediaCardUtils", () => {
  it("classifies file extensions correctly", () => {
    expect(getFileCardType("photo.png")).toBe("image");
    expect(getFileCardType("images/diagram.jpg")).toBe("image");
    expect(getFileCardType("diagram.JPEG")).toBe("image");
    expect(getFileCardType("asset.gif")).toBe("image");
    expect(getFileCardType("icon.svg")).toBe("image");
    expect(getFileCardType("image.webp")).toBe("image");
    expect(getFileCardType("clip.mp4")).toBe("video");
    expect(getFileCardType("recordings/demo.webm")).toBe("video");
    expect(getFileCardType("movie.mov")).toBe("video");
    expect(getFileCardType("notes/Concept.md")).toBe("markdown");
    expect(getFileCardType("unknown.xyz")).toBe("unknown");
    expect(getFileCardType("")).toBe("unknown");
  });

  it("identifies media files correctly", () => {
    expect(isMediaFile("photo.png")).toBe(true);
    expect(isMediaFile("clip.mp4")).toBe(true);
    expect(isMediaFile("doc.md")).toBe(false);
    expect(isMediaFile("file.canvas")).toBe(false);
  });

  it("generates timestamped pasted media filenames", () => {
    const filename = generatePastedMediaFilename("png");
    expect(filename).toMatch(/^attachments\/Pasted image \d{14}\.png$/);
  });
});

describe("MediaCardView", () => {
  it("renders an <img> with lazy loading for image media", () => {
    render(
      <MediaCardView
        filePath="attachments/diagram.png"
        mediaType="image"
        alt="Architecture Diagram"
      />,
    );

    const img = screen.getByTestId("media-image") as HTMLImageElement;
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe("attachments/diagram.png");
    expect(img.getAttribute("alt")).toBe("Architecture Diagram");
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.getAttribute("decoding")).toBe("async");
  });

  it("renders a <video> with controls and preload metadata for video media", () => {
    render(
      <MediaCardView
        filePath="recordings/demo.mp4"
        mediaType="video"
      />,
    );

    const video = screen.getByTestId("media-video") as HTMLVideoElement;
    expect(video).toBeDefined();
    expect(video.getAttribute("src")).toBe("recordings/demo.mp4");
    expect(video.hasAttribute("controls")).toBe(true);
    expect(video.getAttribute("preload")).toBe("metadata");
  });

  it("resolves media URL via CanvasEditorContext resolveMediaUrl", () => {
    const resolveMediaUrl = vi.fn((path: string) => `asset://resolved/${path}`);

    render(
      <CanvasEditorContext.Provider
        value={{
          onNodeTextChange: () => {},
          onLayoutChange: () => {},
          resolveMediaUrl,
        }}
      >
        <MediaCardView filePath="photo.png" mediaType="image" />
      </CanvasEditorContext.Provider>,
    );

    expect(resolveMediaUrl).toHaveBeenCalledWith("photo.png");
    const img = screen.getByTestId("media-image") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("asset://resolved/photo.png");
  });

  it("shows error fallback state when media fails to load", () => {
    render(
      <MediaCardView filePath="corrupt.png" mediaType="image" />,
    );

    const img = screen.getByTestId("media-image");
    fireEvent.error(img);

    expect(screen.getByTestId("media-error")).toBeDefined();
    expect(screen.getByText("Failed to load media")).toBeDefined();
    expect(screen.getByText("corrupt.png")).toBeDefined();
  });

  it("renders empty state when filePath is empty", () => {
    render(<MediaCardView filePath="" mediaType="image" />);
    expect(screen.getByText("No media file selected")).toBeDefined();
  });
});
