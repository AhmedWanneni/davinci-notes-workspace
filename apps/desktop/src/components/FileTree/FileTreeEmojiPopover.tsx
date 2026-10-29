import { lazy, Suspense, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FileTreeEmojiSkeleton } from "./FileTreeEmojiSkeleton";
import { getEmojiPopoverPosition } from "./getEmojiPopoverPosition";

const LazyEmojiPicker = lazy(() =>
  import("./FileTreeEmojiPicker").then((module) => ({
    default: module.FileTreeEmojiPicker,
  })),
);

interface FileTreeEmojiPopoverProps {
  x: number;
  y: number;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function FileTreeEmojiPopover({
  x,
  y,
  onSelect,
  onClose,
}: FileTreeEmojiPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="file-tree__emoji-popover"
      style={getEmojiPopoverPosition(x, y)}
    >
      <Suspense
        fallback={
          <div className="file-tree__emoji-picker">
            <div className="file-tree__emoji-picker-header">
              <span className="file-tree__emoji-tab" />
              <span className="file-tree__emoji-close" />
            </div>
            <div className="file-tree__emoji-search-row">
              <div className="file-tree__emoji-search-wrap">
                <span className="file-tree__emoji-search" />
              </div>
            </div>
            <div className="file-tree__emoji-viewport">
              <FileTreeEmojiSkeleton />
            </div>
          </div>
        }
      >
        <LazyEmojiPicker onClose={onClose} onSelect={onSelect} />
      </Suspense>
    </div>,
    document.body,
  );
}
