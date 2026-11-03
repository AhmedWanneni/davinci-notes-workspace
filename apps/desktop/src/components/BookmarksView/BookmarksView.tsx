import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useBookmarks } from "../../bookmarks/useBookmarks";
import { useBookmarkUIStore } from "../../bookmarks/useBookmarkUIStore";
import type {
  BookmarksPageTab,
  WebBookmarkItem,
} from "../../bookmarks/bookmarkTypes";
import { organizeBookmarksWithAI } from "../../bookmarks/organizeBookmarksWithAI";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { WebBookmarksSubView } from "./WebBookmarksSubView";
import { WebBookmarkAddBar } from "./WebBookmarkAddBar";
import { WebBookmarkImportModal } from "./WebBookmarkImportModal";
import { useNoteBookmarkItems } from "./useNoteBookmarkItems";
import styles from "./BookmarksView.module.scss";

export interface BookmarksViewProps {
  onOpenNote: (path: string, newTab: boolean) => void;
  initialPage?: BookmarksPageTab;
  hideSidebar?: boolean;
}

export function BookmarksView({
  onOpenNote,
  initialPage = "notes",
  hideSidebar = false,
}: BookmarksViewProps) {
  const {
    bookmarks,
    webBookmarks,
    canUndoOrganization,
    removeBookmark,
    addWebBookmark,
    updateWebBookmark,
    removeWebBookmark,
    importWebBookmarks,
    applyWebBookmarksOrganization,
    undoLastOrganization,
  } = useBookmarks();
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const noteItems = useNoteBookmarkItems();

  const {
    pageTab,
    setPageTab,
    activeSection,
    showAddBar,
    setShowAddBar,
    showImportModal,
    setShowImportModal,
  } = useBookmarkUIStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isOrganizingAI, setIsOrganizingAI] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialPage) {
      setPageTab(initialPage);
    }
  }, [initialPage, setPageTab]);

  const handleOpenExternal = useCallback(
    (url: string) => {
      if (
        url.startsWith("internal://") ||
        url.endsWith(".md") ||
        url.endsWith(".canvas") ||
        allNotePaths.includes(url)
      ) {
        onOpenNote(url, false);
        return;
      }
      invoke("open_bookmark_url", { url }).catch(() => {
        window.open(url, "_blank", "noopener,noreferrer");
      });
    },
    [allNotePaths, onOpenNote],
  );

  const handleOrganizeWithAI = useCallback(
    async (targetItems?: readonly WebBookmarkItem[]) => {
      const list = targetItems ?? webBookmarks;
      if (list.length === 0) return;
      setIsOrganizingAI(true);
      try {
        const existingFolders = Array.from(
          new Set(
            webBookmarks
              .map((w) => w.folder)
              .filter((f): f is string => Boolean(f)),
          ),
        );
        const res = await organizeBookmarksWithAI(list, { existingFolders });
        applyWebBookmarksOrganization(res.updates);
        setStatusMessage(
          `Organized ${res.organizedCount} link${res.organizedCount === 1 ? "" : "s"} ${res.usedAI ? "with AI" : "into smart categories"}.`,
        );
      } finally {
        setIsOrganizingAI(false);
      }
    },
    [webBookmarks, applyWebBookmarksOrganization],
  );

  return (
    <div className={styles["bookmarks-view"]}>
      <WebBookmarksSubView
        variant={pageTab === "links" ? "links" : "notes"}
        items={pageTab === "links" ? webBookmarks : noteItems}
        searchQuery={searchQuery}
        statusMessage={statusMessage}
        isOrganizingAI={isOrganizingAI}
        canUndoOrganization={canUndoOrganization}
        onUndoOrganization={() => {
          undoLastOrganization();
          setStatusMessage("Reverted AI organization changes.");
        }}
        onDismissStatus={() => setStatusMessage(null)}
        onOpenAddBar={() => setShowAddBar(true)}
        onOpenImportModal={() => setShowImportModal(true)}
        onOpenExternal={handleOpenExternal}
        onOrganizeItems={(items) => void handleOrganizeWithAI(items)}
        onUpdate={updateWebBookmark}
        onRemove={pageTab === "links" ? removeWebBookmark : removeBookmark}
        onSearchChange={setSearchQuery}
        pageTab={pageTab}
        onPageTabChange={setPageTab}
        noteCount={bookmarks.length}
        hideSidebar={hideSidebar}
      />

      {showAddBar && (
        <WebBookmarkAddBar
          onAdd={(input) => {
            addWebBookmark(input);
            setShowAddBar(false);
          }}
          onAddBatch={(items) => {
            const { addedCount } = importWebBookmarks(items);
            setShowAddBar(false);
            setStatusMessage(
              `Added ${items.length} bookmark${items.length === 1 ? "" : "s"} (${addedCount} new).`,
            );
          }}
          onCancel={() => setShowAddBar(false)}
        />
      )}

      {showImportModal && (
        <WebBookmarkImportModal
          onClose={() => setShowImportModal(false)}
          onImport={(items, autoOrganize) => {
            const { addedCount } = importWebBookmarks(items);
            setShowImportModal(false);
            setStatusMessage(
              `Imported ${items.length} bookmark${items.length === 1 ? "" : "s"} (${addedCount} new).`,
            );
            if (autoOrganize) {
              const uncategorized = items.filter((i) => !i.folder);
              void handleOrganizeWithAI(
                uncategorized.length > 0 ? uncategorized : items,
              );
            }
          }}
        />
      )}
    </div>
  );
}
