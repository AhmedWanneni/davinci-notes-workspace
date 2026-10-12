import { type ReactNode, useEffect, useState } from "react";
import { AppSidebarHeader } from "./AppSidebarHeader";
import { FileTree } from "../FileTree";
import { VaultSwitcher } from "../VaultSwitcher";
import { useSidebarResize } from "./useSidebarResize";

export interface AppSidebarProps {
  vaultName: string;
  vaultPath?: string | null;
  allNotePaths: string[];
  allFolderPaths: string[];
  activeNotePath: string | null;
  dirtyNotes: Set<string>;
  log: string[];
  navigation?: ReactNode;
  isCollapsed?: boolean;
  isMac: boolean;
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
  onSwitchVault?: (path: string) => void;
  onOpenFolderPicker?: () => void;
  onCreateNewVault?: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
}

export function AppSidebar({
  vaultName,
  vaultPath,
  allNotePaths,
  allFolderPaths,
  activeNotePath,
  dirtyNotes,
  log,
  navigation,
  isCollapsed,
  isMac,
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
  onSwitchVault,
  onOpenFolderPicker,
  onCreateNewVault,
  onOpenSettings,
  onOpenHelp,
}: AppSidebarProps) {
  const { width, isResizing, handleMouseDown } = useSidebarResize();
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

  const handleTabChange = (tab: "files" | "search" | "bookmarks") => {
    setCurrentTab(tab);
    onTabChange?.(tab);
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
      data-resizing={isResizing || undefined}
      style={!isCollapsed ? { width: `${width}px` } : undefined}
      aria-label="File Explorer"
    >
      <AppSidebarHeader
        isMac={isMac}
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onOpenSearch={onOpenSearch}
        onOpenTags={onOpenTags}
        onToggleLeftSidebar={onToggleLeftSidebar}
      />

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

      <VaultSwitcher
        vaultName={vaultName}
        vaultPath={vaultPath ?? null}
        onSwitchVault={onSwitchVault ?? (() => {})}
        onOpenFolderPicker={onOpenFolderPicker ?? (() => {})}
        onCreateNewVault={onCreateNewVault}
        onOpenSettings={onOpenSettings}
        onOpenHelp={onOpenHelp}
      />

      {log.length > 0 && <pre className="debug-log">{log.join("\n")}</pre>}

      {!isCollapsed && (
        <div
          className="app-sidebar__resizer"
          onMouseDown={handleMouseDown}
          aria-hidden="true"
        />
      )}
    </aside>
  );
}

