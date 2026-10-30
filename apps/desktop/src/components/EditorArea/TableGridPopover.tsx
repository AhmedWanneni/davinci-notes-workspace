import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TableGridPicker } from "./TableGridPicker";
import styles from "./TableGridPicker.module.scss";

export interface TableGridPopoverProps {
  anchorRect: DOMRect | null;
  onSelect: (cols: number, rows: number) => void;
  onClose: () => void;
}

export function TableGridPopover({
  anchorRect,
  onSelect,
  onClose,
}: TableGridPopoverProps) {
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
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!anchorRect || typeof document === "undefined") {
    return null;
  }

  const top = anchorRect.bottom + 4;
  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - 200));

  return createPortal(
    <div
      ref={popoverRef}
      className={styles["table-grid-popover"]}
      style={{
        position: "fixed",
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 1000,
      }}
    >
      <TableGridPicker
        onSelect={(cols, rows) => {
          onSelect(cols, rows);
          onClose();
        }}
      />
    </div>,
    document.body,
  );
}
