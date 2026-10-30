// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { attachImageResizeOverlay } from "./imageResizeOverlay";

describe("attachImageResizeOverlay", () => {
  it("does not attach resize handles or toolbar in read-only mode", () => {
    const container = document.createElement("div");
    const image = document.createElement("img");
    container.appendChild(image);

    attachImageResizeOverlay({
      container,
      image,
      isReadOnly: true,
      onCommitWidth: vi.fn(),
    });

    expect(container.classList.contains("cm-image-resizable-wrapper")).toBe(
      true,
    );
    expect(container.querySelector(".cm-image-resize-handle")).toBeNull();
    expect(container.querySelector(".cm-image-toolbar")).toBeNull();
  });

  it("attaches handles, badge, and preset toolbar when editable", () => {
    const container = document.createElement("div");
    const image = document.createElement("img");
    container.appendChild(image);

    const onCommitWidth = vi.fn();
    attachImageResizeOverlay({
      container,
      image,
      isReadOnly: false,
      onCommitWidth,
    });

    expect(
      container.querySelector(".cm-image-resize-handle-right"),
    ).not.toBeNull();
    expect(
      container.querySelector(".cm-image-resize-handle-corner"),
    ).not.toBeNull();
    expect(container.querySelector(".cm-image-resize-badge")).not.toBeNull();
    expect(container.querySelector(".cm-image-toolbar")).not.toBeNull();

    const buttons = container.querySelectorAll<HTMLButtonElement>(
      ".cm-image-toolbar-btn",
    );
    expect(buttons.length).toBe(5);
    expect(buttons[0]?.textContent).toBe("25%");
    expect(buttons[1]?.textContent).toBe("50%");
    expect(buttons[2]?.textContent).toBe("75%");
    expect(buttons[3]?.textContent).toBe("100%");
    expect(buttons[4]?.textContent).toBe("Reset");
  });

  it("invokes onCommitWidth with target width when a preset button is clicked", () => {
    const parent = document.createElement("div");
    Object.defineProperty(parent, "clientWidth", {
      value: 600,
      configurable: true,
    });
    const container = document.createElement("div");
    parent.appendChild(container);
    const image = document.createElement("img");
    container.appendChild(image);

    const onCommitWidth = vi.fn();
    attachImageResizeOverlay({
      container,
      image,
      isReadOnly: false,
      onCommitWidth,
    });

    const buttons = container.querySelectorAll<HTMLButtonElement>(
      ".cm-image-toolbar-btn",
    );
    // Click 50%
    buttons[1]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onCommitWidth).toHaveBeenCalledWith(300);

    // Click Reset (5th button)
    buttons[4]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onCommitWidth).toHaveBeenCalledWith(undefined);
  });

  it("handles mouse drag lifecycle and commits adjusted width", () => {
    const container = document.createElement("div");
    const image = document.createElement("img");
    Object.defineProperty(image, "getBoundingClientRect", {
      value: () => ({
        width: 200,
        height: 150,
        top: 0,
        left: 0,
        right: 200,
        bottom: 150,
      }),
      configurable: true,
    });
    container.appendChild(image);

    const onCommitWidth = vi.fn();
    attachImageResizeOverlay({
      container,
      image,
      isReadOnly: false,
      onCommitWidth,
    });

    const handle = container.querySelector<HTMLElement>(
      ".cm-image-resize-handle-right",
    )!;
    expect(handle).not.toBeNull();

    // Start drag at X = 100
    handle.dispatchEvent(
      new MouseEvent("mousedown", { clientX: 100, bubbles: true }),
    );
    expect(container.classList.contains("is-resizing")).toBe(true);

    // Drag to X = 150 (+50px)
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 150 }));
    expect(image.style.width).toBe("250px");

    // Release mouse
    window.dispatchEvent(new MouseEvent("mouseup", { clientX: 150 }));
    expect(container.classList.contains("is-resizing")).toBe(false);
    expect(onCommitWidth).toHaveBeenCalledWith(250);
  });
});
