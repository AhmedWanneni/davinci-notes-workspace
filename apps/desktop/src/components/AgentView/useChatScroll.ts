import { useState, useEffect, useCallback, useRef, type RefObject } from "react";

export interface UseChatScrollOptions {
  threshold?: number;
  containerRef?: RefObject<HTMLDivElement | null>;
}

export interface UseChatScrollReturn {
  isAtBottom: boolean;
  showScrollBottomBtn: boolean;
  scrollToBottom: (smooth?: boolean) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
}

export function useChatScroll(
  dependencies: unknown[] = [],
  options: UseChatScrollOptions = {},
): UseChatScrollReturn {
  const { threshold = 40, containerRef } = options;
  const internalRef = useRef<HTMLDivElement | null>(null);
  const activeRef = containerRef ?? internalRef;

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const isAtBottomRef = useRef(true);

  const checkIsAtBottom = useCallback(() => {
    const el = activeRef.current;
    if (!el) return true;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceFromBottom <= threshold;
  }, [activeRef, threshold]);

  const handleScroll = useCallback(() => {
    const atBottom = checkIsAtBottom();
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
    setShowScrollBottomBtn(!atBottom);
  }, [checkIsAtBottom]);

  const scrollToBottom = useCallback(
    (smooth = false) => {
      const el = activeRef.current;
      if (!el) return;
      isAtBottomRef.current = true;
      setIsAtBottom(true);
      setShowScrollBottomBtn(false);
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    },
    [activeRef],
  );

  useEffect(() => {
    const el = activeRef.current;
    if (!el) return;

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [activeRef, handleScroll]);

  // When dependencies change (e.g. streaming chunks or new messages arrive)
  useEffect(() => {
    if (isAtBottomRef.current) {
      const el = activeRef.current;
      if (!el) return;
      const frameId = requestAnimationFrame(() => {
        if (isAtBottomRef.current && el) {
          el.scrollTop = el.scrollHeight;
        }
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isAtBottom,
    showScrollBottomBtn,
    scrollToBottom,
    scrollRef: activeRef,
  };
}
