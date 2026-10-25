import React, { useRef, useCallback } from "react";
import type { DatabaseColumn } from "./databaseTypes";
import {
  TextTIcon,
  HashIcon,
  TagIcon,
  CheckSquareIcon,
  CalendarBlankIcon,
  DotsThreeIcon,
} from "./DatabaseIcons";
import styles from "./DatabaseHeaderCell.module.scss";

export interface DatabaseHeaderCellProps {
  column: DatabaseColumn;
  width: number;
  onOpenModal: (column: DatabaseColumn) => void;
  onResize?: (newWidth: number) => void;
}

export function getColumnIcon(type: DatabaseColumn["type"]) {
  switch (type) {
    case "number":
      return <HashIcon size={14} />;
    case "select":
      return <TagIcon size={14} />;
    case "checkbox":
      return <CheckSquareIcon size={14} />;
    case "date":
      return <CalendarBlankIcon size={14} />;
    case "text":
    default:
      return <TextTIcon size={14} />;
  }
}

export function DatabaseHeaderCell({
  column,
  width,
  onOpenModal,
  onResize,
}: DatabaseHeaderCellProps) {
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(width);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startXRef.current;
        const newWidth = Math.max(60, startWidthRef.current + delta);
        onResize?.(newWidth);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [width, onResize],
  );

  return (
    <div
      className={styles["database-header-cell"]}
      style={{ width, minWidth: width, maxWidth: width }}
      role="columnheader"
    >
      <div
        className={styles["header-title-container"]}
        onClick={() => onOpenModal(column)}
        title={`Click to configure "${column.name}"`}
      >
        <span className={styles["type-icon"]}>
          {getColumnIcon(column.type)}
        </span>
        <span className={styles["column-name"]}>{column.name}</span>
      </div>

      <div className={styles["header-actions"]}>
        <button
          type="button"
          className={styles["icon-btn"]}
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal(column);
          }}
          aria-label={`Options for ${column.name}`}
        >
          <DotsThreeIcon size={14} />
        </button>
      </div>

      <div
        className={styles["resize-handle"]}
        onMouseDown={handleMouseDown}
        aria-hidden="true"
      />
    </div>
  );
}
