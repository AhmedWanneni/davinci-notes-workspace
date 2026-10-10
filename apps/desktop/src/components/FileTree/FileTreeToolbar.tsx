import {
  CaretUpDown,
  FolderPlus,
  NotePencil,
  SortAscending,
  SortDescending,
} from "@phosphor-icons/react";
import { Tooltip } from "@app/design-system";
import styles from "./FileTreeToolbar.module.scss";
import type { TreeSortOrder } from "./tree-utils";

export interface FileTreeToolbarProps {
  onCreateNote: () => void;
  onCreateFolder: () => void;
  sortOrder: TreeSortOrder;
  onToggleSort: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
}

function CollapseAllIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="none"
      stroke="currentColor"
      strokeWidth="16"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="48" y1="48" x2="208" y2="48" />
      <rect x="48" y="96" width="160" height="64" rx="16" />
      <line x1="48" y1="208" x2="208" y2="208" />
    </svg>
  );
}

export function FileTreeToolbar({
  onCreateNote,
  onCreateFolder,
  sortOrder,
  onToggleSort,
  onCollapseAll,
  onExpandAll,
}: FileTreeToolbarProps) {
  const isAsc = sortOrder === "name-asc";

  return (
    <div
      className={styles.toolbar}
      role="toolbar"
      aria-label="File tree actions"
    >
      <Tooltip content="New note" contentProps={{ side: "bottom" }}>
        <button
          type="button"
          className={styles.button}
          onClick={onCreateNote}
          aria-label="New note"
        >
          <NotePencil size={18} weight="regular" />
        </button>
      </Tooltip>

      <Tooltip content="New folder" contentProps={{ side: "bottom" }}>
        <button
          type="button"
          className={styles.button}
          onClick={onCreateFolder}
          aria-label="New folder"
        >
          <FolderPlus size={18} weight="regular" />
        </button>
      </Tooltip>

      <Tooltip
        content={
          isAsc ? "Change sort order (A to Z)" : "Change sort order (Z to A)"
        }
        contentProps={{ side: "bottom" }}
      >
        <button
          type="button"
          className={styles.button}
          onClick={onToggleSort}
          aria-label={isAsc ? "Sort A to Z" : "Sort Z to A"}
        >
          {isAsc ? (
            <SortAscending size={18} weight="regular" />
          ) : (
            <SortDescending size={18} weight="regular" />
          )}
        </button>
      </Tooltip>

      <Tooltip content="Collapse all" contentProps={{ side: "bottom" }}>
        <button
          type="button"
          className={styles.button}
          onClick={onCollapseAll}
          aria-label="Collapse all"
        >
          <CollapseAllIcon size={18} />
        </button>
      </Tooltip>

      <Tooltip content="Expand all" contentProps={{ side: "bottom" }}>
        <button
          type="button"
          className={styles.button}
          onClick={onExpandAll}
          aria-label="Expand all"
        >
          <CaretUpDown size={18} weight="regular" />
        </button>
      </Tooltip>
    </div>
  );
}
