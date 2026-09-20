import {
  BookmarkSimple,
  FolderSimple,
  MagnifyingGlass,
  SidebarSimple,
} from "@phosphor-icons/react";
import { type ReactNode, useEffect, useState } from "react";
import { Tooltip } from "@app/design-system";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { WindowControls } from "../WindowControls";
import { FileTree } from "../FileTree";

export interface AppSidebarProps {
  vaultName: string;
  allNotePaths: string[];
  allFolderPaths: string[];
  activeNotePath: string | null;
  dirtyNotes: Set<string>;
  log: string[];
  navigation?: ReactNode;
  isCollapsed?: boolean;
  activeTab?: "files" | "search" | "bookmarks";
  onTabChange?: (tab: "files" | "search" | "bookmarks") => void;
  onToggleLeftSidebar?: () => void;
  onOpenSearch?: () => void;
  onOpenTags?: () => void;
  onCreateNote: (parentFolder?: string) => void | Promise<unknown>;
  onCreateFolder: (parentFolder?: string) => Promise<string | null>;
  onCreateCanvas?: () => void;
  onNoteClick: (path: string) => void;
  onRenameNote?: (oldPath: string, newStem: string) => Promise<boolean>;
  onRenameFolder?: (oldPath: string, newName: string) => Promise<boolean>;
  onDeleteNote?: (path: string) => Promise<boolean>;
  onDeleteFolder?: (path: string) => Promise<boolean>;
  onDuplicateNote?: (path: string) => Promise<boolean>;
  onMoveNote?: (path: string, newParentFolder: string) => Promise<boolean>;
  onMoveFile?: (path: string, newParentFolder: string) => Promise<boolean>;
  onDropFiles?: (targetFolder: string, files: readonly File[]) => Promise<void>;
  onSelectedFolderChange?: (folderPath: string | null) => void;
  pendingRenameFolder?: string | null;
  pendingRenameNote?: string | null;
  onPendingRenameFolderHandled?: () => void;
  onPendingRenameNoteHandled?: () => void;
}

export function AppSidebar({
  allNotePaths,
  allFolderPaths,
  activeNotePath,
  dirtyNotes,
  log,
  navigation,
  isCollapsed,
  activeTab = "files",
  onTabChange,
  onToggleLeftSidebar,
  onOpenSearch,
  onOpenTags,
  onCreateNote,
  onCreateFolder,
  onNoteClick,
  onRenameNote,
  onRenameFolder,
  onDeleteNote,
  onDeleteFolder,
  onDuplicateNote,
  onMoveNote,
  onMoveFile,
  onDropFiles,
  onSelectedFolderChange,
  pendingRenameFolder,
  pendingRenameNote,
  onPendingRenameFolderHandled,
  onPendingRenameNoteHandled,
}: AppSidebarProps) {
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(
    null,
  );
  const [currentTab, setCurrentTab] = useState<
    "files" | "search" | "bookmarks"
  >(activeTab);

  const handleSelectedFolderChange = (folderPath: string | null) => {
    setSelectedFolderPath(folderPath);
    onSelectedFolderChange?.(folderPath);
  };

  useEffect(() => {
    if (selectedFolderPath && !allFolderPaths.includes(selectedFolderPath)) {
      setSelectedFolderPath(null);
      onSelectedFolderChange?.(null);
    }
  }, [allFolderPaths, onSelectedFolderChange, selectedFolderPath]);

  return (
    <aside
      className="app-sidebar"
      data-collapsed={isCollapsed || undefined}
      aria-label="File Explorer"
    >
      <div className="app-sidebar__header">
        <WindowControls />
        <div className="app-sidebar__header-nav">
          <Tooltip content="Files" contentProps={{ side: "bottom" }}>
            <button
              type="button"
              className={`app-sidebar__nav-btn ${currentTab === "files" ? "is-active" : ""}`}
              onClick={() => {
                setCurrentTab("files");
                onTabChange?.("files");
              }}
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
                setCurrentTab("search");
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
                setCurrentTab("bookmarks");
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
          onDoubleClick={() => void getCurrentWindow().toggleMaximize()}
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

      <div className="app-sidebar__content">
        {navigation}
        <FileTree
          filePaths={allNotePaths}
          folderPaths={allFolderPaths}
          activePath={activeNotePath}
          dirtyPaths={dirtyNotes}
          pendingRenameFolder={pendingRenameFolder}
          pendingRenameNote={pendingRenameNote}
          onNoteClick={onNoteClick}
          onCreateNote={onCreateNote}
          onCreateFolder={onCreateFolder}
          onPendingRenameHandled={onPendingRenameFolderHandled}
          onPendingRenameNoteHandled={onPendingRenameNoteHandled}
          onRenameNote={onRenameNote}
          onRenameFolder={onRenameFolder}
          onDeleteNote={onDeleteNote}
          onDeleteFolder={onDeleteFolder}
          onDuplicateNote={onDuplicateNote}
          onMoveNote={onMoveNote}
          onMoveFile={onMoveFile}
          onDropFiles={onDropFiles}
          onSelectedFolderChange={handleSelectedFolderChange}
        />
      </div>

      {log.length > 0 && <pre className="debug-log">{log.join("\n")}</pre>}
    </aside>
  );
}
