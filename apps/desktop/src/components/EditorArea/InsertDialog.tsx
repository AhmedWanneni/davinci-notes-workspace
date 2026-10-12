import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@app/design-system";
import type {
  InsertDialogInput,
  InsertDialogRequest,
} from "@app/editor";
import styles from "./InsertDialog.module.scss";

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
      const message = err instanceof Error ? err.message : "Failed to import image.";
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
    <Dialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent
        className={styles["insert-dialog-root"]}
        showCloseButton={false}
      >
        <div className={styles["insert-dialog-header"]}>
          <h2 className={styles["insert-dialog-title"]}>{dialogSpec.title}</h2>
          {dialogSpec.description && (
            <p className={styles["insert-dialog-description"]}>
              {dialogSpec.description}
            </p>
          )}
        </div>

        <div className={styles["insert-dialog-body"]}>
          {isImageSources && (
            <div className={styles["insert-dialog-tabs"]}>
              <button
                type="button"
                className={`${styles["insert-dialog-tab"]} ${
                  activeSource === "file" ? styles["is-active"] : ""
                }`}
                onClick={() => {
                  setActiveSource("file");
                  setError(null);
                }}
              >
                Local file
              </button>
              <button
                type="button"
                className={`${styles["insert-dialog-tab"]} ${
                  activeSource === "url" ? styles["is-active"] : ""
                }`}
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
                <div className={styles["insert-dialog-file-chosen"]}>
                  Imported: {localPath}
                </div>
              )}
            </div>
          ) : (
            <input
              ref={inputRef}
              className={styles["insert-dialog-input"]}
              placeholder={dialogSpec.placeholder || "https://..."}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
            />
          )}

          {error && (
            <div className={styles["insert-dialog-error"]} role="alert">
              {error}
            </div>
          )}
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
            type="button"
            className={styles["insert-dialog-btn-confirm"]}
            onClick={() => handleSubmit()}
          >
            {dialogSpec.confirmLabel || "Insert"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
