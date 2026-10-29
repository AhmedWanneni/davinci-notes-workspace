import { lazy, Suspense, useEffect, useState } from "react";
import { AppSidebarHeader } from "./AppSidebarHeader";
import type { AppSidebarProps } from "./AppSidebarTypes";
import { FileTree } from "../FileTree";
import { IconRail } from "../IconRail";
import { VaultSwitcher } from "../VaultSwitcher";
import { useSidebarResize } from "./useSidebarResize";

export type { AppSidebarProps } from "./AppSidebarTypes";

const LazyGitSidebarPanel = lazy(() =>
  import("@app/git-manager").then((m) => ({ default: m.GitSidebarPanel })),
);

export function AppSidebar({
  vaultName,
  vaultPath,
  allNotePaths,
  allFolderPaths,
  activeNotePath,
  dirtyNotes,
  log: _log,
  navigation,
  isCollapsed,
  isMac,
  activeTab = "files",
  onTabChange,
  onToggleLeftSidebar,
  onOpenSearch,
  onOpenTags,
  isGlobalGraphOpen,
  isCalendarOpen,
  isBookmarksOpen,
  isRemindersOpen,
  isAgentOpen,
  isListeningOpen,
  isAskVaultOpen,
  isGitManagerOpen,
  isGitEnabled,
  onOpenGitManager,
  onOpenGlobalGraph,
  onOpenCalendar,
  onOpenBookmarks,
  onOpenAgent,
  onOpenListening,
  onOpenAskVault,
  onCloseVault,
  onDailyNotes,
  onOpenReminders,
  onCreateNote,
  onCreateFolder,
  onCreateCanvas,
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
  onOpenVaultFromDrive,
  onSyncVault,
  onOpenSettings,
  onOpenSyncSettings,
  onOpenHelp,
  onOpenLogs,
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
        onOpenSyncSettings={onOpenSyncSettings ?? onOpenSettings}
      />

      <div className="app-sidebar__content">
        <IconRail
          isLeftSidebarOpen={!isCollapsed}
          isGlobalGraphOpen={isGlobalGraphOpen}
          isCalendarOpen={isCalendarOpen}
          isBookmarksOpen={isBookmarksOpen}
          isRemindersOpen={isRemindersOpen}
          isAgentOpen={isAgentOpen}
          isListeningOpen={isListeningOpen}
          isAskVaultOpen={isAskVaultOpen}
          isGitManagerOpen={isGitManagerOpen}
          isGitEnabled={isGitEnabled}
          onOpenGitManager={onOpenGitManager}
          onToggleLeftSidebar={onToggleLeftSidebar ?? (() => {})}
          onOpenSearch={onOpenSearch ?? (() => {})}
          onOpenGlobalGraph={onOpenGlobalGraph ?? (() => {})}
          onOpenCalendar={onOpenCalendar}
          onOpenBookmarks={onOpenBookmarks}
          onOpenAgent={onOpenAgent}
          onOpenListening={onOpenListening}
          onOpenAskVault={onOpenAskVault}
          onOpenSettings={onOpenSettings ?? (() => {})}
          onCloseVault={onCloseVault ?? (() => {})}
          onDailyNotes={onDailyNotes}
          onCreateCanvas={onCreateCanvas}
          onOpenReminders={onOpenReminders}
        />
        {navigation}
        {isGitManagerOpen ? (
          <Suspense
            fallback={
              <div
                style={{
                  padding: "var(--space-4)",
                  color: "var(--color-text-muted)",
                }}
              >
                Loading Source Control...
              </div>
            }
          >
            <LazyGitSidebarPanel
              onOpenDiff={(change) => {
                const uri = `git-diff://${change.path}?staged=${change.staged ? "1" : "0"}&status=${change.statusCode}`;
                onNoteClick(uri);
              }}
            />
          </Suspense>
        ) : (
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
        )}
      </div>

      <VaultSwitcher
        isCollapsed={isCollapsed}
        vaultName={vaultName}
        vaultPath={vaultPath ?? null}
        onSwitchVault={onSwitchVault ?? (() => {})}
        onOpenFolderPicker={onOpenFolderPicker ?? (() => {})}
        onCreateNewVault={onCreateNewVault}
        onOpenVaultFromDrive={onOpenVaultFromDrive}
        onSyncVault={onSyncVault}
        onOpenSettings={onOpenSettings}
        onOpenHelp={onOpenHelp}
        onOpenLogs={onOpenLogs}
      />

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
