import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Folders,
  Globe,
  ListBullets,
  MagnifyingGlass,
  Plus,
  UploadSimple,
} from "@phosphor-icons/react";
import type {
  WebBookmarkItem,
  WebBookmarkSortOption,
} from "../../bookmarks/bookmarkTypes";
import { WebBookmarkRow } from "./WebBookmarkRow";
import { WebBookmarksCategoryView } from "./WebBookmarksCategoryView";
import styles from "./BookmarksView.module.scss";
import webStyles from "./WebBookmarks.module.scss";
import catStyles from "./WebBookmarksCategoryView.module.scss";

export interface WebBookmarksSubViewProps {
  items: readonly WebBookmarkItem[];
  searchQuery: string;
  sortOption: WebBookmarkSortOption;
  statusMessage: string | null;
  isOrganizingAI?: boolean;
  canUndoOrganization: boolean;
  onUndoOrganization: () => void;
  onDismissStatus: () => void;
  onOpenAddBar: () => void;
  onOpenImportModal: () => void;
  onOpenExternal: (url: string) => void;
  onOrganizeItems?: (items: readonly WebBookmarkItem[]) => void;
  onUpdate: (
    id: string,
    patch: Partial<
      Pick<WebBookmarkItem, "title" | "url" | "folder" | "tags" | "description">
    >,
  ) => void;
  onRemove: (id: string) => void;
  onSearchChange: (q: string) => void;
}

export function WebBookmarksSubView({
  items,
  searchQuery,
  sortOption,
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
}: WebBookmarksSubViewProps) {
  const [selectedFolder, setSelectedFolder] = useState<string>("__all__");
  const [viewMode, setViewMode] = useState<"categories" | "list">("categories");
  const listContainerRef = useRef<HTMLDivElement>(null);

  const folderCounts = useMemo(() => {
    const map = new Map<string, number>();
    let uncategorized = 0;
    for (const item of items) {
      if (item.folder) map.set(item.folder, (map.get(item.folder) ?? 0) + 1);
      else uncategorized += 1;
    }
    return {
      sorted: Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])),
      uncategorized,
    };
  }, [items]);

  const filteredAndSorted = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const tagFilter = query.startsWith("#") ? query.slice(1) : null;
    const filtered = items.filter((item) => {
      if (selectedFolder === "__uncategorized__" && item.folder) return false;
      if (
        selectedFolder !== "__all__" &&
        selectedFolder !== "__uncategorized__" &&
        item.folder !== selectedFolder
      ) {
        return false;
      }
      if (!query) return true;
      if (tagFilter) {
        return (item.tags ?? []).some((t) => t.toLowerCase().includes(tagFilter));
      }
      return (
        item.title.toLowerCase().includes(query) ||
        item.url.toLowerCase().includes(query) ||
        (item.domain ?? "").toLowerCase().includes(query) ||
        (item.folder ?? "").toLowerCase().includes(query) ||
        (item.description ?? "").toLowerCase().includes(query) ||
        (item.tags ?? []).some((t) => t.toLowerCase().includes(query))
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === "alpha") return a.title.localeCompare(b.title);
      if (sortOption === "domain") return (a.domain ?? a.url).localeCompare(b.domain ?? b.url);
      return b.addedAt - a.addedAt;
    });
  }, [items, searchQuery, selectedFolder, sortOption]);

  const shouldVirtualize = viewMode === "list" && filteredAndSorted.length > 200;
  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? filteredAndSorted.length : 0,
    getScrollElement: () => listContainerRef.current,
    estimateSize: () => 68,
    overscan: 10,
  });

  const renderRow = (item: WebBookmarkItem) => (
    <WebBookmarkRow
      key={item.id}
      item={item}
      isSelected={false}
      onOpenExternal={onOpenExternal}
      onSelectFolder={setSelectedFolder}
      onSelectTag={(t) => onSearchChange(`#${t}`)}
      onUpdate={onUpdate}
      onRemove={onRemove}
    />
  );

  return (
    <>
      {items.length > 0 && (
        <div className={catStyles["category-toolbar"]} role="toolbar" aria-label="Filter web bookmarks by category">
          <div className={catStyles["category-chips"]}>
            <button
              type="button"
              className={`${webStyles["folder-chip"]} ${selectedFolder === "__all__" ? webStyles["is-active"] : ""}`}
              onClick={() => setSelectedFolder("__all__")}
            >
              All ({items.length})
            </button>
            {folderCounts.uncategorized > 0 && (
              <button
                type="button"
                className={`${webStyles["folder-chip"]} ${selectedFolder === "__uncategorized__" ? webStyles["is-active"] : ""}`}
                onClick={() => setSelectedFolder("__uncategorized__")}
              >
                Uncategorized ({folderCounts.uncategorized})
              </button>
            )}
            {folderCounts.sorted.map(([folder, count]) => (
              <button
                key={folder}
                type="button"
                className={`${webStyles["folder-chip"]} ${selectedFolder === folder ? webStyles["is-active"] : ""}`}
                onClick={() => setSelectedFolder(folder)}
              >
                {folder} ({count})
              </button>
            ))}
          </div>

          <div className={catStyles["view-switcher"]} role="group" aria-label="Web bookmarks display mode">
            <button
              type="button"
              className={`${catStyles["view-btn"]} ${viewMode === "categories" ? catStyles["is-active"] : ""}`}
              onClick={() => setViewMode("categories")}
            >
              <Folders size={13} /> By Category
            </button>
            <button
              type="button"
              className={`${catStyles["view-btn"]} ${viewMode === "list" ? catStyles["is-active"] : ""}`}
              onClick={() => setViewMode("list")}
            >
              <ListBullets size={13} /> List
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className={webStyles["status-banner"]} role="status">
          <span>{statusMessage}</span>
          <div style={{ display: "flex", gap: "8px" }}>
            {canUndoOrganization && (
              <button type="button" className={webStyles["action-btn"]} onClick={onUndoOrganization}>
                Undo AI Organization
              </button>
            )}
            <button type="button" className={webStyles["action-btn"]} onClick={onDismissStatus}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div ref={listContainerRef} className={styles["bookmarks-view__list-container"]}>
        {items.length === 0 ? (
          <div className={styles["bookmarks-view__empty-state"]}>
            <div className={styles["bookmarks-view__empty-icon"]}><Globe size={24} weight="regular" /></div>
            <h2 className={styles["bookmarks-view__empty-title"]}>No web bookmarks yet</h2>
            <p className={styles["bookmarks-view__empty-desc"]}>
              Choose your browser (Chrome, Firefox, Brave, Arc, Edge) to automatically import your bookmarks and organize them by category.
            </p>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button type="button" className={`${webStyles["action-btn"]} ${webStyles["is-primary"]}`} onClick={onOpenImportModal}>
                <UploadSimple size={14} /> Import from Chrome / Firefox / Brave
              </button>
              <button type="button" className={webStyles["action-btn"]} onClick={onOpenAddBar}>
                <Plus size={14} /> Add Link
              </button>
            </div>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className={styles["bookmarks-view__empty-state"]}>
            <div className={styles["bookmarks-view__empty-icon"]}><MagnifyingGlass size={24} weight="regular" /></div>
            <h2 className={styles["bookmarks-view__empty-title"]}>No matching web links</h2>
            <p className={styles["bookmarks-view__empty-desc"]}>No saved links match your current search or category filter.</p>
          </div>
        ) : viewMode === "categories" ? (
          <WebBookmarksCategoryView
            items={filteredAndSorted}
            isOrganizingAI={isOrganizingAI}
            onOpenExternal={onOpenExternal}
            onSelectFolder={setSelectedFolder}
            onSelectTag={(t) => onSearchChange(`#${t}`)}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onOrganizeUncategorized={onOrganizeItems}
          />
        ) : shouldVirtualize ? (
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
            {rowVirtualizer.getVirtualItems().map((vRow) => (
              <div key={filteredAndSorted[vRow.index].id} style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${vRow.start}px)` }}>
                {renderRow(filteredAndSorted[vRow.index])}
              </div>
            ))}
          </div>
        ) : (
          <ul className={styles["bookmarks-view__list"]} role="listbox">{filteredAndSorted.map(renderRow)}</ul>
        )}
      </div>
    </>
  );
}
