import React, { useState, useRef, useEffect, useMemo } from "react";
import type { DatabaseColumn } from "./databaseTypes";
import {
  validateCellValue,
  parseCheckboxValue,
  formatCheckboxValue,
} from "./typeValidators";
import {
  renderInlineMarkdown,
  type InlineRenderOptions,
} from "./renderInlineMarkdown";
import {
  WarningCircleIcon,
  FilePageIcon,
  SidebarOpenIcon,
} from "./DatabaseIcons";
import { getSelectPillStyle } from "./databaseColors";
import styles from "./DatabaseCellComponent.module.scss";

export interface DatabaseCellProps extends InlineRenderOptions {
  value: string;
  column: DatabaseColumn;
  rowId: string;
  colIndex: number;
  isFocused?: boolean;
  isEditing?: boolean;
  onSave: (val: string) => void;
  onCancel: () => void;
  onStartEdit: () => void;
  onClick: () => void;
}

export function DatabaseCellComponent({
  value,
  column,
  colIndex,
  isFocused,
  isEditing,
  onSave,
  onCancel,
  onStartEdit,
  onClick,
  onLinkClick,
  onTagClick,
}: DatabaseCellProps) {
  const [draft, setDraft] = useState(value);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isSelectOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isSelectOpen]);

  const validation = useMemo(() => validateCellValue(value, column), [value, column]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSave(draft);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDraft(value);
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <div
        className={`${styles["database-cell"]} ${styles["is-editing"]}`}
        onClick={onClick}
      >
        <input
          ref={inputRef}
          type={
            column.type === "number"
              ? "text"
              : column.type === "date"
                ? "date"
                : "text"
          }
          className={`${styles["cell-input"]}${column.type === "number" ? ` ${styles["is-number"]}` : ""}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onSave(draft)}
        />
      </div>
    );
  }

  if (column.type === "checkbox") {
    const isChecked = parseCheckboxValue(value);
    return (
      <div
        className={`${styles["database-cell"]}${isFocused ? ` ${styles["is-focused"]}` : ""}`}
        onClick={onClick}
      >
        <input
          type="checkbox"
          className={styles["cell-checkbox"]}
          checked={isChecked}
          onChange={() => {
            const nextVal = formatCheckboxValue(!isChecked, value);
            onSave(nextVal);
          }}
          aria-label={`${column.name} checkbox`}
        />
      </div>
    );
  }

  if (column.type === "select") {
    const option = column.options?.find(
      (o) => o.value.toLowerCase() === value.trim().toLowerCase(),
    );
    const colorStyle = getSelectPillStyle(option?.color);

    return (
      <div
        className={`${styles["database-cell"]}${isFocused ? ` ${styles["is-focused"]}` : ""}${!validation.isValid ? ` ${styles["has-warning"]}` : ""}`}
        onClick={() => {
          onClick();
          setIsSelectOpen(true);
        }}
      >
        {value.trim() ? (
          <span className={styles["select-pill"]} style={colorStyle}>
            {value.trim()}
          </span>
        ) : (
          <span style={{ color: "var(--color-text-faint, #a0a0a0)" }} />
        )}

        {!validation.isValid && (
          <span className={styles["warning-icon"]} title={validation.warning}>
            <WarningCircleIcon size={14} />
          </span>
        )}

        {isSelectOpen && (
          <div
            className={styles["select-dropdown"]}
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
          >
            {column.options?.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={styles["select-option-item"]}
                onClick={() => {
                  onSave(opt.value);
                  setIsSelectOpen(false);
                }}
              >
                <span
                  className={styles["select-pill"]}
                  style={getSelectPillStyle(opt.color)}
                >
                  {opt.value}
                </span>
              </button>
            ))}
            <button
              type="button"
              className={styles["select-option-item"]}
              onClick={() => {
                onSave("");
                setIsSelectOpen(false);
              }}
            >
              <span style={{ color: "var(--color-text-muted)" }}>Clear</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${styles["database-cell"]}${column.type === "number" ? ` ${styles["is-number"]}` : ""}${isFocused ? ` ${styles["is-focused"]}` : ""}${!validation.isValid ? ` ${styles["has-warning"]}` : ""}`}
      onClick={onClick}
      onDoubleClick={onStartEdit}
    >
      <div
        className={`${styles["cell-content"]}${column.type === "number" ? ` ${styles["is-number"]}` : ""}`}
      >
        {colIndex === 0 && (
          <span className={styles["page-icon"]}>
            <FilePageIcon size={14} />
          </span>
        )}
        <span>{renderInlineMarkdown(value, { onLinkClick, onTagClick })}</span>
        {colIndex === 0 && value.trim() && (
          <button
            type="button"
            className={styles["open-btn"]}
            onClick={(e) => {
              e.stopPropagation();
              onLinkClick?.(value.trim());
            }}
            title="Open page"
          >
            <SidebarOpenIcon size={11} />
            <span>OPEN</span>
          </button>
        )}
      </div>
      {!validation.isValid && (
        <span className={styles["warning-icon"]} title={validation.warning}>
          <WarningCircleIcon size={14} />
        </span>
      )}
    </div>
  );
}
