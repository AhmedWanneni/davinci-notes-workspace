import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useBookmarks } from "../../bookmarks/useBookmarks";
import type {
  BookmarksPageTab,
  BookmarkSortOption,
  WebBookmarkItem,
  WebBookmarkSortOption,
} from "../../bookmarks/bookmarkTypes";
import { organizeBookmarksWithAI } from "../../bookmarks/organizeBookmarksWithAI";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { loadTreeIcons } from "../../icons/treeIconStorage";
import { BookmarksHeader } from "./BookmarksHeader";
import { NoteBookmarksSubView } from "./NoteBookmarksSubView";
import { WebBookmarksSubView } from "./WebBookmarksSubView";
import { WebBookmarkAddBar } from "./WebBookmarkAddBar";
import { WebBookmarkImportModal } from "./WebBookmarkImportModal";
import { useBookmarkKeyboardNav } from "./useBookmarkKeyboardNav";
import styles from "./BookmarksView.module.scss";

export interface BookmarksViewProps {
  onOpenNote: (path: string, newTab: boolean) => void;
  initialPage?: BookmarksPageTab;
}

export function BookmarksView({
  onOpenNote,
  initialPage = "notes",
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
  const notesContent = useWorkspaceStore((state) => state.notesContent);

  const [activePage, setActivePage] = useState<BookmarksPageTab>(initialPage);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<BookmarkSortOption>("recent");
  const [webSortOption, setWebSortOption] =
    useState<WebBookmarkSortOption>("recent");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [icons, setIcons] = useState<Record<string, string>>({});
  const [showAddBar, setShowAddBar] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isOrganizingAI, setIsOrganizingAI] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadTreeIcons().then(setIcons);
  }, []);

  const filteredAndSorted = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = bookmarks.filter((b) => {
      if (!query) return true;
      const title = b.path.replace(/\.(md|canvas)$/i, "").toLowerCase();
      return title.includes(query) || b.path.toLowerCase().includes(query);
    });

    return list.sort((a, b) => {
      if (sortOption === "alpha") {
        const titleA = a.path.split("/").pop() ?? a.path;
        const titleB = b.path.split("/").pop() ?? b.path;
        return titleA.localeCompare(titleB);
      }
      return b.addedAt - a.addedAt;
    });
  }, [bookmarks, searchQuery, sortOption]);

  useBookmarkKeyboardNav({
    items: activePage === "notes" ? filteredAndSorted : [],
    selectedIndex,
    setSelectedIndex,
    onOpen: onOpenNote,
    onRemove: removeBookmark,
    searchInputRef,
  });

  const handleOpenExternal = useCallback((url: string) => {
    invoke("open_external_url", { url }).catch(() => {
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }, []);

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
      <BookmarksHeader
        activePage={activePage}
        onPageChange={(page) => {
          setActivePage(page);
          setSearchQuery("");
        }}
        noteCount={bookmarks.length}
        linkCount={webBookmarks.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        sortOption={sortOption}
        onSortChange={setSortOption}
        webSortOption={webSortOption}
        onWebSortChange={setWebSortOption}
        isOrganizingAI={isOrganizingAI}
        canUndoOrganization={canUndoOrganization}
        onOpenAddLink={() => setShowAddBar((v) => !v)}
        onOpenImportModal={() => setShowImportModal(true)}
        onOrganizeWithAI={() => void handleOrganizeWithAI()}
        onUndoOrganization={() => {
          undoLastOrganization();
          setStatusMessage("Reverted AI organization changes.");
        }}
      />

      {activePage === "links" && showAddBar && (
        <WebBookmarkAddBar
          onAdd={(input) => {
            addWebBookmark(input);
            setShowAddBar(false);
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

      {activePage === "links" ? (
        <WebBookmarksSubView
          items={webBookmarks}
          searchQuery={searchQuery}
          sortOption={webSortOption}
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
          onRemove={removeWebBookmark}
          onSearchChange={setSearchQuery}
        />
      ) : (
        <NoteBookmarksSubView
          bookmarks={bookmarks}
          filteredAndSorted={filteredAndSorted}
          searchQuery={searchQuery}
          selectedIndex={selectedIndex}
          icons={icons}
          allNotePaths={allNotePaths}
          notesContent={notesContent}
          onOpenNote={onOpenNote}
          onRemoveBookmark={removeBookmark}
        />
      )}
    </div>
  );
}
