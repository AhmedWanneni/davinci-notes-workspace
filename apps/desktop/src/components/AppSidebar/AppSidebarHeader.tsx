import {
  BookmarkSimple,
  FolderSimple,
  MagnifyingGlass,
  SidebarSimple,
} from "@phosphor-icons/react";
import { Tooltip } from "@app/design-system";
import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";
import { WindowControls } from "../WindowControls";

export interface AppSidebarHeaderProps {
  isMac: boolean;
  currentTab: "files" | "search" | "bookmarks";
  onTabChange?: (tab: "files" | "search" | "bookmarks") => void;
  onOpenSearch?: () => void;
  onOpenTags?: () => void;
  onToggleLeftSidebar?: () => void;
}

export function AppSidebarHeader({
  isMac,
  currentTab,
  onTabChange,
  onOpenSearch,
  onOpenTags,
  onToggleLeftSidebar,
}: AppSidebarHeaderProps) {
  return (
    <div className="app-sidebar__header">
      <WindowControls variant={isMac ? "mac" : "default"} />
      <div className="app-sidebar__header-nav">
        <Tooltip content="Files" contentProps={{ side: "bottom" }}>
          <button
            type="button"
            className={`app-sidebar__nav-btn ${currentTab === "files" ? "is-active" : ""}`}
            onClick={() => onTabChange?.("files")}
            aria-label="Files"
          >
            <FolderSimple size={18} weight="regular" />
          </button>
        </Tooltip>
        <Tooltip content="Search (Cmd+P)" contentProps={{ side: "bottom" }}>
          <button
            type="button"
            className={`app-sidebar__nav-btn ${currentTab === "search" ? "is-active" : ""}`}
            onClick={() => {
              onTabChange?.("search");
              onOpenSearch?.();
            }}
            aria-label="Search"
          >
            <MagnifyingGlass size={18} weight="regular" />
          </button>
        </Tooltip>
        <Tooltip content="Bookmarks" contentProps={{ side: "bottom" }}>
          <button
            type="button"
            className={`app-sidebar__nav-btn ${currentTab === "bookmarks" ? "is-active" : ""}`}
            onClick={() => {
              onTabChange?.("bookmarks");
              onOpenTags?.();
            }}
            aria-label="Bookmarks"
          >
            <BookmarkSimple size={18} weight="regular" />
          </button>
        </Tooltip>
      </div>
      <div
        className="app-sidebar__drag-region"
        data-tauri-drag-region
        onDoubleClick={() => {
          if (hasPlatformAdapters()) {
            void getPlatformAdapters().windowControls.maximize();
          }
        }}
      />
      <div className="app-sidebar__header-actions">
        {onToggleLeftSidebar && (
          <Tooltip content="Toggle sidebar" contentProps={{ side: "bottom" }}>
            <button
              type="button"
              className="app-sidebar__action-btn"
              onClick={onToggleLeftSidebar}
              aria-label="Toggle sidebar"
            >
              <SidebarSimple size={18} weight="regular" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
