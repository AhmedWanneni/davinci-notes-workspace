import React, { useState, useRef, useEffect } from "react";
import { PaletteIcon, CheckIcon } from "./KanbanIcons";
import styles from "./KanbanLaneColorPicker.module.scss";

export interface LaneColorOption {
  label: string;
  color?: string;
}

export const LANE_COLORS: readonly LaneColorOption[] = [
  { label: "Default" },
  { label: "Purple", color: "#cd47ab" },
  { label: "Blue", color: "#3b82f6" },
  { label: "Teal", color: "#06b6d4" },
  { label: "Green", color: "#10b981" },
  { label: "Yellow", color: "#f59e0b" },
  { label: "Orange", color: "#f97316" },
  { label: "Red", color: "#ef4444" },
];

export interface KanbanLaneColorPickerProps {
  currentColor?: string;
  onColorChange: (color?: string) => void;
}

export function KanbanLaneColorPicker({
  currentColor,
  onColorChange,
}: KanbanLaneColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  return (
    <div className={styles["color-picker-container"]} ref={containerRef}>
      <button
        type="button"
        className={styles["palette-button"]}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label="Change column color"
        title="Change column color"
        style={currentColor ? { color: currentColor } : undefined}
      >
        <PaletteIcon size={14} />
      </button>

      {isOpen && (
        <div
          className={styles["color-picker-popover"]}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles["color-picker-grid"]}>
            {LANE_COLORS.map((opt) => {
              const isSelected =
                (!opt.color && !currentColor) || opt.color === currentColor;
              return (
                <button
                  key={opt.label}
                  type="button"
                  className={`${styles["swatch-button"]}${isSelected ? ` ${styles["is-selected"]}` : ""}`}
                  style={
                    opt.color
                      ? { backgroundColor: opt.color }
                      : {
                          backgroundColor: "var(--color-bg-secondary, #f6f6f6)",
                          borderColor: "var(--color-border-subtle, #e4e4e4)",
                        }
                  }
                  onClick={() => {
                    onColorChange(opt.color);
                    setIsOpen(false);
                  }}
                  title={opt.label}
                  aria-label={opt.label}
                >
                  {isSelected && (
                    <span
                      className={styles["check-icon"]}
                      style={
                        opt.color
                          ? { color: "#ffffff" }
                          : { color: "var(--color-text-normal, #222222)" }
                      }
                    >
                      <CheckIcon size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
