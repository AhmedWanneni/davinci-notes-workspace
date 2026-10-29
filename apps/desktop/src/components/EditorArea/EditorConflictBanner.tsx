import React from "react";
import { WarningCircle } from "@phosphor-icons/react";
import styles from "./EditorConflictBanner.module.scss";

export interface EditorConflictBannerProps {
  path: string;
  onKeepMine: () => void;
  onUseDisk: () => void;
  onSaveCopy: () => void;
}

export function EditorConflictBanner({
  path,
  onKeepMine,
  onUseDisk,
  onSaveCopy,
}: EditorConflictBannerProps) {
  const fileName = path.split("/").pop() ?? path;

  return (
    <div
      className={styles["conflict-banner"]}
      role="alert"
      aria-live="assertive"
      data-testid="editor-conflict-banner"
    >
      <div className={styles["conflict-banner__header"]}>
        <WarningCircle
          size={16}
          weight="fill"
          className={styles["conflict-banner__icon"]}
        />
        <span>External conflict detected in {fileName}</span>
      </div>
      <p className={styles["conflict-banner__text"]}>
        This file was modified outside Sophia while you were editing it.
        Autosave is paused to prevent data loss. Choose an action:
      </p>
      <div className={styles["conflict-banner__actions"]}>
        <button
          type="button"
          className={`${styles["conflict-banner__btn"]} ${styles["conflict-banner__btn--primary"]}`}
          onClick={onSaveCopy}
          title="Save your uncommitted edits as a separate conflict file and load disk version"
        >
          Save mine as a copy
        </button>
        <button
          type="button"
          className={styles["conflict-banner__btn"]}
          onClick={onUseDisk}
          title="Discard in-editor edits and load the disk version"
        >
          Use the disk version
        </button>
        <button
          type="button"
          className={styles["conflict-banner__btn"]}
          onClick={onKeepMine}
          title="Overwrite the disk version with your in-editor edits"
        >
          Keep my version
        </button>
      </div>
    </div>
  );
}
