import React, { useState, useRef, useEffect } from "react";
import type { InsertDialogSpec, InsertDialogInput } from "@app/editor";
import styles from "./InsertDialog.module.scss";

export interface InsertCreatorFormProps {
  dialogSpec: InsertDialogSpec;
  isDatabase: boolean;
  onConfirm: (input: InsertDialogInput) => void;
  onCancel: () => void;
}

export function InsertCreatorForm({
  dialogSpec,
  isDatabase,
  onConfirm,
  onCancel,
}: InsertCreatorFormProps) {
  const [val, setVal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = val.trim();
    if (!trimmed) {
      setError(
        isDatabase
          ? "Please enter a table name."
          : "Please enter a board name.",
      );
      return;
    }
    onConfirm({ name: trimmed });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles["insert-dialog-body"]}>
        <input
          ref={inputRef}
          type="text"
          className={styles["insert-dialog-input"]}
          placeholder={
            dialogSpec.placeholder ||
            (isDatabase ? "Table title..." : "Board title...")
          }
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            setError(null);
          }}
        />
        {error && <p className={styles["insert-dialog-error"]}>{error}</p>}
      </div>
      <div className={styles["insert-dialog-footer"]}>
        <button
          type="button"
          className={styles["insert-dialog-btn-cancel"]}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles["insert-dialog-btn-confirm"]}
        >
          {dialogSpec.confirmLabel ||
            (isDatabase ? "Create Table" : "Create Board")}
        </button>
      </div>
    </form>
  );
}
