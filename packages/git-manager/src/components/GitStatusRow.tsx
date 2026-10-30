import type { ReactNode } from "react";
import { FileText } from "@phosphor-icons/react";
import type { GitFileChange } from "../types/gitTypes";
import styles from "./GitStatusRow.module.scss";

export interface GitStatusRowProps {
  change: GitFileChange;
  actions?: ReactNode;
  onClick?: () => void;
}

export function GitStatusRow({ change, actions, onClick }: GitStatusRowProps) {
  const parts = change.path.split("/");
  const filename = parts.pop() || change.path;
  const directory = parts.join("/");

  return (
    <div
      className={styles["git-status-row"]}
      onClick={onClick}
      data-testid={`git-status-row-${change.path}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className={styles["git-status-row__info"]}>
        <FileText size={15} className={styles["git-status-row__icon"]} />
        <span className={styles["git-status-row__filename"]}>{filename}</span>
        {directory && (
          <span className={styles["git-status-row__directory"]}>
            {directory}
          </span>
        )}
      </div>

      <div className={styles["git-status-row__trailing"]}>
        {actions && (
          <div
            className={styles["git-status-row__actions"]}
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
        <span
          className={styles["git-status-row__badge"]}
          data-status={change.statusCode}
          title={`Status: ${change.statusCode}`}
        >
          {change.statusCode}
        </span>
      </div>
    </div>
  );
}
