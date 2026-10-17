// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useSidebarResize } from "./useSidebarResize";

describe("useSidebarResize", () => {
  it("defaults to initial width and clamps resizing within min/max bounds", () => {
    const { result } = renderHook(() =>
      useSidebarResize({ initialWidth: 240, minWidth: 180, maxWidth: 400 }),
    );

    expect(result.current.width).toBe(240);
    expect(result.current.isResizing).toBe(false);

    // Start resize
    act(() => {
      result.current.handleMouseDown({
        clientX: 200,
        preventDefault: () => {},
      } as unknown as React.MouseEvent);
    });
    expect(result.current.isResizing).toBe(true);

    // Drag right by 50px -> 240 + 50 = 290
    act(() => {
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 250 }));
    });
    expect(result.current.width).toBe(290);

    // Drag beyond maxWidth -> clamped at 400
    act(() => {
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 500 }));
    });
    expect(result.current.width).toBe(400);

    // Drag below minWidth -> clamped at 180
    act(() => {
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 50 }));
    });
    expect(result.current.width).toBe(180);

    // Finish resize
    act(() => {
      document.dispatchEvent(new MouseEvent("mouseup"));
    });
    expect(result.current.isResizing).toBe(false);
  });
});
