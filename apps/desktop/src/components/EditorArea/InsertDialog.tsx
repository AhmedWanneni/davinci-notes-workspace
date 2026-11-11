import React, { useState, useEffect, useRef } from "react";
import type { InsertDialogInput, InsertDialogRequest } from "@app/editor";
import { WindowDialog } from "../WindowDialog";
import styles from "./InsertDialog.module.scss";
import { InsertNotePicker } from "./InsertNotePicker";
import { ReminderDatePicker } from "./ReminderDatePicker";
import { InsertCreatorForm } from "./InsertCreatorForm";

export interface InsertDialogProps {
  request: InsertDialogRequest | null;
  onConfirm: (input: InsertDialogInput) => void;
  onCancel: () => void;
  onPickLocalFile?: () => Promise<string | null>;
}

export function InsertDialog({
  request,
  onConfirm,
  onCancel,
  onPickLocalFile,
}: InsertDialogProps) {
  const dialogSpec = request?.item.dialog;
  const isImageSources = dialogSpec?.kind === "image-sources";

  const [url, setUrl] = useState("");
  const [activeSource, setActiveSource] = useState<"file" | "url">(
    isImageSources ? "file" : "url",
  );
  const [localPath, setLocalPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (request && dialogSpec) {
      setUrl("");
      setActiveSource(isImageSources ? "file" : "url");
      setLocalPath(null);
      setError(null);
      setIsPicking(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [request, dialogSpec, isImageSources]);

  if (!request || !dialogSpec) return null;

  if (dialogSpec.kind === "note-picker") {
    return (
      <WindowDialog
        isOpen={Boolean(request)}
        onClose={onCancel}
        title={dialogSpec.title}
        subtitle={dialogSpec.description}
        size="md"
        footer={
          <button
            type="button"
            className={styles["insert-dialog-btn-cancel"]}
            onClick={onCancel}
          >
            Cancel
          </button>
        }
      >
        <div className={styles["insert-dialog-body"]}>
          <InsertNotePicker
            onSelect={(target, heading) => onConfirm({ target, heading })}
            onCancel={onCancel}
          />
        </div>
      </WindowDialog>
    );
  }

  if (dialogSpec.kind === "reminder-picker") {
    return (
      <ReminderDatePicker
        open={Boolean(request)}
        onConfirm={({ date, time }) => onConfirm({ date, time })}
        onCancel={onCancel}
      />
    );
  }

  if (
    dialogSpec.kind === "kanban-creator" ||
    dialogSpec.kind === "database-creator"
  ) {
    const isDatabase = dialogSpec.kind === "database-creator";
    return (
      <WindowDialog
        isOpen={Boolean(request)}
        onClose={onCancel}
        title={dialogSpec.title}
        subtitle={dialogSpec.description}
        size="md"
      >
        <InsertCreatorForm
          dialogSpec={dialogSpec}
          isDatabase={isDatabase}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      </WindowDialog>
    );
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isImageSources && activeSource === "file") {
      if (!localPath) {
        setError("Please choose a local image file.");
        return;
      }
      onConfirm({ path: localPath });
      return;
    }

    const trimmedUrl = url.trim();
    if (dialogSpec.validate) {
      const validationError = dialogSpec.validate({ url: trimmedUrl });
      if (validationError) {
        setError(validationError);
        return;
      }
    } else if (!trimmedUrl) {
      setError("URL cannot be empty.");
      return;
    }

    onConfirm({ url: trimmedUrl });
  };

  const handlePickFile = async () => {
    if (!onPickLocalFile) return;
    try {
      setIsPicking(true);
      setError(null);
      const chosenPath = await onPickLocalFile();
      if (chosenPath) {
        setLocalPath(chosenPath);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to import image.";
      setError(message);
    } finally {
      setIsPicking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <WindowDialog
      isOpen={Boolean(request)}
      onClose={onCancel}
      title={dialogSpec.title}
      subtitle={dialogSpec.description}
      size="md"
      footer={
        <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "flex-end" }}>
          <button
            type="button"
            className={styles["insert-dialog-btn-cancel"]}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles["insert-dialog-btn-confirm"]}
            onClick={() => handleSubmit()}
          >
            {dialogSpec.confirmLabel || "Insert"}
          </button>
        </div>
      }
    >
      <div className={styles["insert-dialog-body"]}>
        {isImageSources && (
          <div className={styles["insert-dialog-tabs"]}>
            <button
              type="button"
              className={`${styles["insert-dialog-tab"]} ${activeSource === "file" ? styles["is-active"] : ""}`}
              onClick={() => { setActiveSource("file"); setError(null); }}
            >
              Local file
            </button>
            <button
              type="button"
              className={`${styles["insert-dialog-tab"]} ${activeSource === "url" ? styles["is-active"] : ""}`}
              onClick={() => {
                setActiveSource("url");
                setError(null);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
            >
              URL
            </button>
          </div>
        )}

        {isImageSources && activeSource === "file" ? (
          <div className={styles["insert-dialog-file-section"]}>
            <button
              type="button"
              className={styles["insert-dialog-file-button"]}
              onClick={handlePickFile}
              disabled={isPicking}
            >
              {isPicking ? "Importing..." : "Choose image file..."}
            </button>
            {localPath && (
              <div className={styles["insert-dialog-file-chosen"]}>Imported: {localPath}</div>
            )}
          </div>
        ) : (
          <input
            ref={inputRef}
            className={styles["insert-dialog-input"]}
            placeholder={dialogSpec.placeholder || "https://..."}
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(null); }}
            onKeyDown={handleKeyDown}
          />
        )}

        {error && (
          <div className={styles["insert-dialog-error"]} role="alert">{error}</div>
        )}
      </div>
    </WindowDialog>
  );
}
