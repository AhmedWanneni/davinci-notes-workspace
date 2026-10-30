import { X } from "@phosphor-icons/react";
import { Button } from "@app/design-system";
import type { GitCommitDetail } from "../types/gitTypes";
import styles from "./GitCommitDetailSheet.module.scss";

export interface GitCommitDetailSheetProps {
  detail: GitCommitDetail;
  onClose?: () => void;
  onSelectFile?: (path: string) => void;
}

export function GitCommitDetailSheet({
  detail,
  onClose,
  onSelectFile,
}: GitCommitDetailSheetProps) {
  const shortHash = detail.hash.slice(0, 7);
  const formattedDate = new Date(detail.authorDate * 1000).toLocaleString();

  return (
    <div
      className={styles["git-commit-detail-sheet"]}
      data-testid="git-commit-detail-sheet"
    >
      <header className={styles["git-commit-detail-sheet__header"]}>
        <span className={styles["git-commit-detail-sheet__hash"]}>
          Commit {shortHash}
        </span>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close commit details"
          >
            <X size={14} />
          </Button>
        )}
      </header>

      <div className={styles["git-commit-detail-sheet__body"]}>
        <div className={styles["git-commit-detail-sheet__meta"]}>
          <div>
            <strong>Author:</strong> {detail.authorName} &lt;{detail.authorEmail}&gt;
          </div>
          <div>
            <strong>Date:</strong> {formattedDate}
          </div>
        </div>

        <div className={styles["git-commit-detail-sheet__message"]}>
          {detail.message}
        </div>

        <div className={styles["git-commit-detail-sheet__files-title"]}>
          Changed Files ({detail.files.length})
        </div>

        <div className={styles["git-commit-detail-sheet__files-list"]}>
          {detail.files.map((file) => (
            <div
              key={file.path}
              className={styles["git-commit-detail-sheet__file-row"]}
              onClick={() => onSelectFile?.(file.path)}
              role="button"
              tabIndex={0}
            >
              <span className={styles["git-commit-detail-sheet__file-path"]}>
                {file.path}
              </span>
              <div className={styles["git-commit-detail-sheet__file-stats"]}>
                {file.insertions > 0 && (
                  <span className={styles["git-commit-detail-sheet__stat-add"]}>
                    +{file.insertions}
                  </span>
                )}
                {file.deletions > 0 && (
                  <span className={styles["git-commit-detail-sheet__stat-del"]}>
                    -{file.deletions}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
