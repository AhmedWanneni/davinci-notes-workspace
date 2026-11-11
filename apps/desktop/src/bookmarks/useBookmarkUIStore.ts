import { create } from "zustand";
import type {
  SidebarSection,
  WebBookmarkSortOption,
  WebBookmarkViewConfig,
} from "./bookmarkTypes";

export const DEFAULT_VIEW_CONFIG: WebBookmarkViewConfig = {
  mode: "list",
  showCover: true,
  showTitle: true,
  showNote: true,
  showDescription: true,
  showHighlights: true,
  showTags: true,
  showBookmarkInfo: true,
  coverSize: 80,
};

export interface BookmarkUIState {
  pageTab: "links" | "notes";
  activeSection: SidebarSection;
  searchQuery: string;
  sortOption: WebBookmarkSortOption;
  viewConfig: WebBookmarkViewConfig;
  showAddBar: boolean;
  showImportModal: boolean;

  setPageTab: (tab: "links" | "notes") => void;
  setActiveSection: (section: SidebarSection) => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (sort: WebBookmarkSortOption) => void;
  setViewConfig: (
    updater:
      | WebBookmarkViewConfig
      | ((prev: WebBookmarkViewConfig) => WebBookmarkViewConfig),
  ) => void;
  setShowAddBar: (open: boolean) => void;
  setShowImportModal: (open: boolean) => void;
}

export const useBookmarkUIStore = create<BookmarkUIState>((set) => ({
  pageTab: "links",
  activeSection: { type: "all" },
  searchQuery: "",
  sortOption: "date-desc",
  viewConfig: DEFAULT_VIEW_CONFIG,
  showAddBar: false,
  showImportModal: false,

  setPageTab: (tab) =>
    set({ pageTab: tab, activeSection: { type: "all" }, searchQuery: "" }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSortOption: (sortOption) => set({ sortOption }),
  setViewConfig: (updater) =>
    set((state) => ({
      viewConfig:
        typeof updater === "function" ? updater(state.viewConfig) : updater,
    })),
  setShowAddBar: (showAddBar) => set({ showAddBar }),
  setShowImportModal: (showImportModal) => set({ showImportModal }),
}));
