import { GitBranch, WarningCircle, FolderSimplePlus } from "@phosphor-icons/react";
import { Button } from "@app/design-system";
import styles from "./GitEmptyState.module.scss";

export interface GitEmptyStateProps {
  type: "not-installed" | "not-repo" | "no-commits";
  onInitialize?: () => void;
  isInitializing?: boolean;
}

export function GitEmptyState({
  type,
  onInitialize,
  isInitializing = false,
}: GitEmptyStateProps) {
  if (type === "not-installed") {
    return (
      <div className={styles["git-empty-state"]} data-testid="git-not-installed">
        <div className={styles["git-empty-state__icon"]}>
          <WarningCircle size={40} weight="regular" />
        </div>
        <h3 className={styles["git-empty-state__title"]}>Git is not installed</h3>
        <p className={styles["git-empty-state__description"]}>
          Git executable was not found on your system PATH. Please install Git to use Version Control features.
        </p>
      </div>
    );
  }

  if (type === "not-repo") {
    return (
      <div className={styles["git-empty-state"]} data-testid="git-not-repo">
        <div className={styles["git-empty-state__icon"]}>
          <FolderSimplePlus size={40} weight="regular" />
        </div>
        <h3 className={styles["git-empty-state__title"]}>Not a Git repository</h3>
        <p className={styles["git-empty-state__description"]}>
          This vault is not yet tracked with Git. Initialize it to start tracking file changes and history.
        </p>
        {onInitialize && (
          <div className={styles["git-empty-state__action"]}>
            <Button
              variant="primary"
              size="sm"
              onClick={onInitialize}
              disabled={isInitializing}
            >
              {isInitializing ? "Initializing..." : "Initialize Repository"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles["git-empty-state"]} data-testid="git-no-commits">
      <div className={styles["git-empty-state__icon"]}>
        <GitBranch size={40} weight="regular" />
      </div>
      <h3 className={styles["git-empty-state__title"]}>No commits yet</h3>
      <p className={styles["git-empty-state__description"]}>
        Stage your changes and make an initial commit to start version history.
      </p>
    </div>
  );
}
