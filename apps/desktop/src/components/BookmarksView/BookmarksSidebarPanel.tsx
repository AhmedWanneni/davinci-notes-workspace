import { useMemo } from "react";
import { useBookmarkStore } from "../../bookmarks/bookmarkStore";
import { useBookmarkUIStore } from "../../bookmarks/useBookmarkUIStore";
import { WebBookmarksSidebar } from "./WebBookmarksSidebar";
import { computeBookmarkCounts } from "./webBookmarkFilters";
import { useNoteBookmarkItems } from "./useNoteBookmarkItems";

export function BookmarksSidebarPanel() {
  const bookmarks = useBookmarkStore((state) => state.bookmarks);
  const webBookmarks = useBookmarkStore((state) => state.webBookmarks);
  const noteItems = useNoteBookmarkItems();

  const pageTab = useBookmarkUIStore((state) => state.pageTab);
  const activeSection = useBookmarkUIStore((state) => state.activeSection);
  const setPageTab = useBookmarkUIStore((state) => state.setPageTab);
  const setActiveSection = useBookmarkUIStore(
    (state) => state.setActiveSection,
  );
  const setShowAddBar = useBookmarkUIStore((state) => state.setShowAddBar);

  const counts = useMemo(
    () =>
      computeBookmarkCounts(pageTab === "links" ? webBookmarks : noteItems),
    [pageTab, webBookmarks, noteItems],
  );

  const handleAddCollection = () => {
    const name = window.prompt("New collection name:");
    if (name?.trim()) {
      setActiveSection({ type: "collection", folder: name.trim() });
      setShowAddBar(true);
    }
  };

  return (
    <WebBookmarksSidebar
      counts={counts}
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      onAddCollection={handleAddCollection}
      pageTab={pageTab}
      onPageTabChange={setPageTab}
      noteCount={bookmarks.length}
      inAppSidebar={true}
    />
  );
}
