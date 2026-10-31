// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useChatScroll } from "./useChatScroll";

describe("useChatScroll", () => {
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    vi.useFakeTimers();
    mockElement = document.createElement("div");
    // Mock dimensions
    Object.defineProperty(mockElement, "clientHeight", {
      configurable: true,
      value: 400,
    });
    Object.defineProperty(mockElement, "scrollHeight", {
      configurable: true,
      writable: true,
      value: 1000,
    });
    mockElement.scrollTop = 600; // 1000 - 600 - 400 = 0 (at bottom)
    mockElement.scrollTo = vi.fn((opts?: ScrollToOptions | number) => {
      if (typeof opts === "object" && opts?.top !== undefined) {
        mockElement.scrollTop = opts.top;
      }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with isAtBottom true and showScrollBottomBtn false", () => {
    const { result } = renderHook(() => useChatScroll([]));
    expect(result.current.isAtBottom).toBe(true);
    expect(result.current.showScrollBottomBtn).toBe(false);
  });

  it("updates state when user scrolls up past threshold", () => {
    const containerRef = { current: mockElement };
    const { result } = renderHook(() =>
      useChatScroll([], { containerRef, threshold: 40 }),
    );

    expect(result.current.isAtBottom).toBe(true);
    expect(result.current.showScrollBottomBtn).toBe(false);

    // User scrolls up to scrollTop = 200 (distance = 1000 - 200 - 400 = 400px > 40px)
    mockElement.scrollTop = 200;
    act(() => {
      mockElement.dispatchEvent(new Event("scroll"));
    });

    expect(result.current.isAtBottom).toBe(false);
    expect(result.current.showScrollBottomBtn).toBe(true);

    // User scrolls back down to scrollTop = 580 (distance = 1000 - 580 - 400 = 20px <= 40px)
    mockElement.scrollTop = 580;
    act(() => {
      mockElement.dispatchEvent(new Event("scroll"));
    });

    expect(result.current.isAtBottom).toBe(true);
    expect(result.current.showScrollBottomBtn).toBe(false);
  });

  it("scrollToBottom resets isAtBottom and hides scroll button", () => {
    const containerRef = { current: mockElement };
    const { result } = renderHook(() =>
      useChatScroll([], { containerRef }),
    );

    // User scrolled up
    mockElement.scrollTop = 100;
    act(() => {
      mockElement.dispatchEvent(new Event("scroll"));
    });
    expect(result.current.showScrollBottomBtn).toBe(true);

    act(() => {
      result.current.scrollToBottom();
    });

    expect(result.current.isAtBottom).toBe(true);
    expect(result.current.showScrollBottomBtn).toBe(false);
    expect(mockElement.scrollTo).toHaveBeenCalledWith({
      top: 1000,
      behavior: "auto",
    });
  });

  it("auto-scrolls when dependencies update if at bottom", () => {
    const containerRef = { current: mockElement };
    const { rerender } = renderHook(
      ({ deps }) => useChatScroll(deps, { containerRef }),
      { initialProps: { deps: [1] } },
    );
    mockElement.scrollTop = 600; // at bottom (1000 - 600 - 400 = 0)

    // Simulate new chunk arriving and content height growing
    Object.defineProperty(mockElement, "scrollHeight", {
      configurable: true,
      value: 1200,
    });
    rerender({ deps: [2] });

    act(() => {
      vi.advanceTimersByTime(20);
    });

    expect(mockElement.scrollTop).toBe(1200);
  });
});
