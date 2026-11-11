import { useState, useMemo } from "react";
import type {
  WebBookmarkItem,
  WebBookmarkSortOption,
  WebBookmarkViewConfig,
} from "../../bookmarks/bookmarkTypes";
import {
  computeBookmarkCounts,
  filterAndSortBookmarks,
} from "./webBookmarkFilters";
import { exportBookmarksToHtml } from "./WebBookmarksExport";
import { useBookmarkUIStore } from "../../bookmarks/useBookmarkUIStore";
import { WebBookmarksSidebar } from "./WebBookmarksSidebar";
import { WebBookmarksTopBar } from "./WebBookmarksTopBar";
import { WebBookmarksViewSwitch } from "./WebBookmarksViewSwitch";
import { WebBookmarkEditModal } from "./WebBookmarkEditModal";
import { WebBookmarksEmptyState } from "./WebBookmarksEmptyState";
import styles from "./WebBookmarksDisplay.module.scss";

export interface WebBookmarksSubViewProps {
  items: readonly WebBookmarkItem[];
  searchQuery: string;
  sortOption?: WebBookmarkSortOption;
  statusMessage?: string | null;
  isOrganizingAI?: boolean;
  canUndoOrganization?: boolean;
  onUndoOrganization?: () => void;
  onDismissStatus?: () => void;
  onOpenAddBar: () => void;
  onOpenImportModal: () => void;
  onOpenExternal: (url: string) => void;
  onOrganizeItems?: (items: readonly WebBookmarkItem[]) => void;
  onUpdate: (id: string, patch: Partial<WebBookmarkItem>) => void;
  onRemove: (id: string) => void;
  onSearchChange: (q: string) => void;
  pageTab?: "links" | "notes";
  onPageTabChange?: (tab: "links" | "notes") => void;
  noteCount?: number;
  hideSidebar?: boolean;
  /**
   * "notes" renders bookmarked vault notes with the same layout as web links:
   * no add/AI/export actions, "edit" opens the note, and removing a bookmark
   * is final (there is no restorable trash for notes).
   */
  variant?: "links" | "notes";
}

const DEFAULT_VIEW_CONFIG: WebBookmarkViewConfig = {
  mode: "list",
  showCover: true,
  showTitle: true,
  showNote: true,
  showDescription: false,
  showHighlights: true,
  showTags: true,
  showBookmarkInfo: true,
  coverSize: 3,
};

export function WebBookmarksSubView({
  items,
  searchQuery,
  sortOption: initialSort = "date-desc",
  statusMessage,
  isOrganizingAI = false,
  canUndoOrganization,
  onUndoOrganization,
  onDismissStatus,
  onOpenAddBar,
  onOpenImportModal,
  onOpenExternal,
  onOrganizeItems,
  onUpdate,
  onRemove,
  onSearchChange,
  pageTab = "links",
  onPageTabChange,
  noteCount = 0,
  hideSidebar = false,
  variant = "links",
}: WebBookmarksSubViewProps) {
  const isNotes = variant === "notes";
  const activeSection = useBookmarkUIStore((s) => s.activeSection);
  const setActiveSection = useBookmarkUIStore((s) => s.setActiveSection);
  const [sortOption, setSortOption] =
    useState<WebBookmarkSortOption>(initialSort);
  const [viewConfig, setViewConfig] =
    useState<WebBookmarkViewConfig>(DEFAULT_VIEW_CONFIG);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [editingItem, setEditingItem] = useState<WebBookmarkItem | null>(null);

  const counts = useMemo(() => computeBookmarkCounts(items), [items]);

  const filteredItems = useMemo(
    () => filterAndSortBookmarks(items, activeSection, searchQuery, sortOption),
    [items, activeSection, searchQuery, sortOption],
  );

  const handleAddCollection = () => {
    const name = window.prompt("New collection name:");
    if (name?.trim()) {
      setActiveSection({ type: "collection", folder: name.trim() });
      onOpenAddBar();
    }
  };

  const handleExport = () => {
    const title =
      activeSection.type === "collection"
        ? activeSection.folder
        : "Web Bookmarks";
    exportBookmarksToHtml(filteredItems, title);
  };

  const handleEdit = (item: WebBookmarkItem) => {
    if (isNotes) onOpenExternal(item.url);
    else setEditingItem(item);
  };

  const handleTrashOrRemove = (id: string) => {
    if (isNotes || activeSection.type === "trash") {
      onRemove(id);
    } else {
      onUpdate(id, { trashed: true });
    }
  };

  return (
    <div className={styles["wb-container"]}>
      {!hideSidebar && (
        <WebBookmarksSidebar
          counts={counts}
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          onAddCollection={handleAddCollection}
          pageTab={pageTab}
          onPageTabChange={onPageTabChange}
          noteCount={noteCount}
        />
      )}

      <div className={styles["wb-main"]}>
        <WebBookmarksTopBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onAskAI={() => void onOrganizeItems?.(filteredItems)}
          onOpenAdd={onOpenAddBar}
          onOpenAddFromBrowser={onOpenImportModal}
          isOrganizingAI={isOrganizingAI}
          variant={variant}
          section={activeSection}
          sortOption={sortOption}
          onSortChange={setSortOption}
          viewConfig={viewConfig}
          onViewConfigChange={setViewConfig}
          onExport={isNotes ? undefined : handleExport}
          showSelectCheckbox={showCheckboxes}
          onToggleSelectCheckbox={() => setShowCheckboxes((prev) => !prev)}
        />

        {statusMessage && (
          <div className={styles["wb-status-banner"]} role="status">
            <span>{statusMessage}</span>
            <div style={{ display: "flex", gap: "8px" }}>
              {canUndoOrganization && onUndoOrganization && (
                <button
                  type="button"
                  className={styles["wb-status-banner__btn"]}
                  onClick={onUndoOrganization}
                >
                  Undo AI Organization
                </button>
              )}
              {onDismissStatus && (
                <button
                  type="button"
                  className={styles["wb-status-banner__btn"]}
                  onClick={onDismissStatus}
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        )}

        <div className={styles["wb-content-scroll"]}>
          {items.length === 0 || filteredItems.length === 0 ? (
            <WebBookmarksEmptyState
              isAllEmpty={items.length === 0}
              onOpenImportModal={onOpenImportModal}
              onOpenAddBar={onOpenAddBar}
              variant={variant}
            />
          ) : (
            <WebBookmarksViewSwitch
              items={filteredItems}
              viewConfig={viewConfig}
              onOpenExternal={onOpenExternal}
              onEdit={handleEdit}
              onRemove={handleTrashOrRemove}
              onRestore={
                isNotes ? undefined : (id) => onUpdate(id, { trashed: false })
              }
              isNotes={isNotes}
              showCheckboxes={showCheckboxes}
            />
          )}
        </div>
      </div>

      {editingItem && (
        <WebBookmarkEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={onUpdate}
        />
      )}
    </div>
  );
}
