import type { ReactNode } from "react";
import { FileText, FileCode, Info, Atom } from "@phosphor-icons/react";
import type { GitFileChange } from "../types/gitTypes";
import styles from "./GitStatusRow.module.scss";

export interface GitStatusRowProps {
  change: GitFileChange;
  actions?: ReactNode;
  onClick?: () => void;
}

function renderFileIcon(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".tsx") || lower.endsWith(".jsx")) {
    return (
      <Atom
        size={15}
        weight="regular"
        className={styles["git-status-row__icon-react"]}
        aria-label="React file"
      />
    );
  }
  if (
    lower.endsWith(".ts") ||
    lower.endsWith(".js") ||
    lower.endsWith(".mjs") ||
    lower.endsWith(".cjs")
  ) {
    return <span className={styles["git-status-row__icon-ts"]}>TS</span>;
  }
  if (
    lower.endsWith(".md") ||
    lower.endsWith(".markdown") ||
    lower.startsWith("readme")
  ) {
    return (
      <Info
        size={15}
        weight="fill"
        className={styles["git-status-row__icon-info"]}
        aria-label="Markdown file"
      />
    );
  }
  if (
    lower.endsWith(".css") ||
    lower.endsWith(".scss") ||
    lower.endsWith(".sass") ||
    lower.endsWith(".less")
  ) {
    return <span className={styles["git-status-row__icon-css"]}>#</span>;
  }
  if (lower.endsWith(".json")) {
    return (
      <FileCode
        size={15}
        className={styles["git-status-row__icon-code"]}
        aria-label="JSON file"
      />
    );
  }
  return (
    <FileText
      size={15}
      className={styles["git-status-row__icon-file"]}
      aria-label="Text file"
    />
  );
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
        {renderFileIcon(filename)}
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
          data-status={change.statusCode === "?" ? "U" : change.statusCode}
          title={`Status: ${change.statusCode === "?" ? "U" : change.statusCode}`}
        >
          {change.statusCode === "?" ? "U" : change.statusCode}
        </span>
      </div>
    </div>
  );
}
