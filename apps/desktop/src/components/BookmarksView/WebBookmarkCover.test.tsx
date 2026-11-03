// @vitest-environment jsdom
import React from "react";
import { describe, expect, it } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { WebBookmarkCover } from "./WebBookmarkCover";

describe("WebBookmarkCover", () => {
  it("renders website cover image when cover is provided", () => {
    const { container } = render(
      <WebBookmarkCover
        url="https://github.com"
        cover="https://example.com/custom-cover.png"
        title="GitHub"
      />,
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://example.com/custom-cover.png");
  });

  it("falls back to favicon if primary cover fails to load", () => {
    const { container } = render(
      <WebBookmarkCover
        url="https://github.com"
        cover="https://broken-link.com/404.jpg"
        favicon="https://github.com/favicon.ico"
        title="GitHub"
      />,
    );

    const img = container.querySelector("img")!;
    expect(img).not.toBeNull();
    fireEvent.error(img);

    // After primary error, it renders fallback favicon
    const fallbackImg = container.querySelector("img");
    expect(fallbackImg?.getAttribute("src")).toBe("https://github.com/favicon.ico");
  });

  it("renders domain placeholder if both primary cover and favicon fail", () => {
    const { container } = render(
      <WebBookmarkCover
        url="https://github.com"
        cover="https://broken-link.com/404.jpg"
        favicon="https://broken-favicon.com/404.ico"
        title="GitHub"
      />,
    );

    const img = container.querySelector("img")!;
    fireEvent.error(img);
    const fallbackImg = container.querySelector("img")!;
    fireEvent.error(fallbackImg);

    expect(container.textContent).toContain("github.com");
  });
});
