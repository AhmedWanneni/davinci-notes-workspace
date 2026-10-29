import React, { useState } from "react";
import type { DatabaseColumn, DatabaseRow } from "./databaseTypes";
import { validateCellValue } from "./typeValidators";
import { TrashIcon } from "./DatabaseIcons";
import styles from "./DatabaseColumnModal.module.scss";

const COLOR_OPTIONS = [
  "gray",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
];

export interface DatabaseColumnModalProps {
  column: DatabaseColumn;
  columnIndex: number;
  rows: DatabaseRow[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: DatabaseColumn) => void;
  onDelete: (columnName: string) => void;
}

export function DatabaseColumnModal({
  column,
  columnIndex,
  rows,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: DatabaseColumnModalProps) {
  const [name, setName] = useState(column.name);
  const [type, setType] = useState<DatabaseColumn["type"]>(column.type);
  const [options, setOptions] = useState(column.options || []);

  if (!isOpen) return null;

  const simulatedCol: DatabaseColumn = { ...column, name, type, options };
  const hasMismatch = rows.some((row) => {
    const val = row.cells[columnIndex] || "";
    return !validateCellValue(val, simulatedCol).isValid;
  });

  const handleAddOption = () => {
    setOptions([
      ...options,
      { value: `Option ${options.length + 1}`, color: "blue" },
    ]);
  };

  const handleUpdateOption = (index: number, val: string, color: string) => {
    const next = [...options];
    next[index] = { value: val, color };
    setOptions(next);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      ...column,
      name: name.trim(),
      type,
      options: type === "select" ? options : undefined,
    });
    onClose();
  };

  return (
    <div className={styles["column-modal-backdrop"]} onClick={onClose}>
      <div
        className={styles["column-modal"]}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles["modal-header"]}>
          <span>Edit Column</span>
          <button
            type="button"
            className={styles["close-btn"]}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className={styles["form-field"]}>
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Column Name"
          />
        </div>

        <div className={styles["form-field"]}>
          <label>Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DatabaseColumn["type"])}
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="select">Select</option>
            <option value="checkbox">Checkbox</option>
            <option value="date">Date</option>
          </select>
        </div>

        {hasMismatch && (
          <div className={styles["warning-box"]}>
            Note: Some existing values do not conform to {type}. They will be
            kept as-is and marked with a warning indicator.
          </div>
        )}

        {type === "select" && (
          <div className={styles["form-field"]}>
            <label>Options</label>
            <div className={styles["options-section"]}>
              {options.map((opt, i) => (
                <div key={i} className={styles["option-row"]}>
                  <input
                    type="text"
                    value={opt.value}
                    onChange={(e) =>
                      handleUpdateOption(i, e.target.value, opt.color)
                    }
                  />
                  <select
                    value={opt.color}
                    onChange={(e) =>
                      handleUpdateOption(i, opt.value, e.target.value)
                    }
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(i)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    <TrashIcon size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                style={{
                  fontSize: 11,
                  background: "none",
                  border: "1px dashed var(--color-border-subtle)",
                  borderRadius: 3,
                  padding: 4,
                  cursor: "pointer",
                  color: "var(--color-interactive-accent)",
                }}
              >
                + Add Option
              </button>
            </div>
          </div>
        )}

        <div className={styles["modal-actions"]}>
          <button
            type="button"
            className={styles["delete-btn"]}
            onClick={() => {
              onDelete(column.name);
              onClose();
            }}
          >
            Delete Column
          </button>
          <button
            type="button"
            className={styles["save-btn"]}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
