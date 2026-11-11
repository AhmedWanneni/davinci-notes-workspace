import {
  SquaresFour,
  ListBullets,
  Trash,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import type { AgentProject, LibraryItemType } from "@app/ai-agent";
import styles from "./AgentLibraryBoard.module.scss";

export interface AgentLibraryTopBarProps {
  projects: AgentProject[];
  projectFilter: string | null;
  onSelectProjectFilter: (pId: string | null) => void;
  typeFilter: LibraryItemType | "all";
  onSelectTypeFilter: (type: LibraryItemType | "all") => void;
  filteredCount: number;
  selectedCount: number;
  onToggleSelectAll: () => void;
  onBatchUseInPrompt: () => void;
  onBatchDelete: () => void;
  viewMode: "grid" | "list";
  onChangeViewMode: (mode: "grid" | "list") => void;
}

export function AgentLibraryTopBar({
  projects = [],
  projectFilter,
  onSelectProjectFilter,
  typeFilter,
  onSelectTypeFilter,
  filteredCount,
  selectedCount,
  onToggleSelectAll,
  onBatchUseInPrompt,
  onBatchDelete,
  viewMode,
  onChangeViewMode,
}: AgentLibraryTopBarProps) {
  const safeProjects = Array.isArray(projects) ? projects : [];

  return (
    <div className={styles["library-board__top-bar"]}>
      <div className={styles["library-board__filter-group"]}>
        <span className={styles["library-board__filter-label"]}>Filter by</span>
        <button
          type="button"
          className={`${styles["library-board__filter-pill"]} ${projectFilter === null ? styles["is-active"] : ""}`}
          onClick={() => onSelectProjectFilter(null)}
        >
          All Projects
        </button>
        {safeProjects.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`${styles["library-board__filter-pill"]} ${projectFilter === p.id ? styles["is-active"] : ""}`}
            onClick={() =>
              onSelectProjectFilter(projectFilter === p.id ? null : p.id)
            }
          >
            <span>{p.name}</span>
          </button>
        ))}
        {(["all", "prompt", "skill", "rule"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles["library-board__filter-pill"]} ${typeFilter === t ? styles["is-active"] : ""}`}
            onClick={() => onSelectTypeFilter(t)}
          >
            {t === "all" ? "All Types" : `${t}s`}
          </button>
        ))}
      </div>

      <div className={styles["library-board__top-right"]}>
        {filteredCount > 0 && (
          <div className={styles["library-board__selection-summary"]}>
            <span>{selectedCount} selected</span>
            <button
              type="button"
              className={styles["library-board__select-all-btn"]}
              onClick={onToggleSelectAll}
            >
              {selectedCount === filteredCount ? "Deselect All" : "Select All"}
            </button>
          </div>
        )}

        {selectedCount > 0 && (
          <div className={styles["library-board__batch-actions"]}>
            <button
              type="button"
              className={`${styles["library-board__batch-btn"]} ${styles["is-primary"]}`}
              onClick={onBatchUseInPrompt}
              title="Use selected items in prompt"
            >
              <PaperPlaneTilt size={13} weight="fill" />
              <span>Use Selected</span>
            </button>
            <button
              type="button"
              className={`${styles["library-board__batch-btn"]} ${styles["is-danger"]}`}
              onClick={onBatchDelete}
              title="Delete selected items"
            >
              <Trash size={13} />
            </button>
          </div>
        )}

        <div className={styles["library-board__view-toggles"]}>
          <button
            type="button"
            className={`${styles["library-board__view-btn"]} ${viewMode === "grid" ? styles["is-active"] : ""}`}
            onClick={() => onChangeViewMode("grid")}
            title="Grid View"
            aria-label="Grid view"
          >
            <SquaresFour size={16} />
          </button>
          <button
            type="button"
            className={`${styles["library-board__view-btn"]} ${viewMode === "list" ? styles["is-active"] : ""}`}
            onClick={() => onChangeViewMode("list")}
            title="List View"
            aria-label="List view"
          >
            <ListBullets size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
