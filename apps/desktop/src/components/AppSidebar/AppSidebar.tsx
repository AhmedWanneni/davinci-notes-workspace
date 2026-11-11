import { useEffect, useState } from "react";
import { AppSidebarHeader } from "./AppSidebarHeader";
import type { AppSidebarProps } from "./AppSidebarTypes";
import { AppSidebarPanels } from "./AppSidebarPanels";
import { IconRail } from "../IconRail";
import { useSidebarResize } from "./useSidebarResize";

export type { AppSidebarProps } from "./AppSidebarTypes";

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
  isTodosOpen,
  isAgentOpen,
  isListeningOpen,
  isAskVaultOpen,
  isGitManagerOpen,
  isGitEnabled,
  onOpenGitManager,
  onOpenGlobalGraph,
  onOpenCalendar,
  onOpenBookmarks,
  onOpenFiles,
  onOpenAgent,
  onOpenListening,
  onOpenAskVault,
  onCloseVault,
  onDailyNotes,
  onOpenReminders,
  onOpenTodos,
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
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<"files" | "search" | "bookmarks">(activeTab);
  const [showFilesInAgent, setShowFilesInAgent] = useState(false);

  useEffect(() => {
    const onReveal = () => setShowFilesInAgent(true);
    window.addEventListener("davinci:reveal-folder", onReveal);
    return () => window.removeEventListener("davinci:reveal-folder", onReveal);
  }, []);

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

  const isAgentPanelActive = isAgentOpen && !showFilesInAgent;

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
        currentTab={isBookmarksOpen ? "bookmarks" : isAgentPanelActive ? "agent" : currentTab}
        onTabChange={(tab) => {
          if (tab === "bookmarks") onOpenBookmarks?.();
          else if (tab === "agent") { setShowFilesInAgent(false); onOpenAgent?.(); }
          else if (tab === "files") { setShowFilesInAgent(false); onOpenFiles?.(); handleTabChange(tab); }
          else handleTabChange(tab);
        }}
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
          isTodosOpen={isTodosOpen}
          isAgentOpen={isAgentOpen}
          isListeningOpen={isListeningOpen}
          isAskVaultOpen={isAskVaultOpen}
          isGitManagerOpen={isGitManagerOpen}
          isGitEnabled={isGitEnabled}
          onOpenGitManager={onOpenGitManager}
          onOpenFiles={onOpenFiles}
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
          onOpenTodos={onOpenTodos}
        />
        {navigation}
        <AppSidebarPanels
          isGitManagerOpen={isGitManagerOpen}
          isBookmarksOpen={isBookmarksOpen}
          isAgentPanelActive={isAgentPanelActive}
          isTodosOpen={isTodosOpen}
          isListeningOpen={isListeningOpen}
          onToggleLeftSidebar={onToggleLeftSidebar}
          onNoteClick={onNoteClick}
          allNotePaths={allNotePaths}
          allFolderPaths={allFolderPaths}
          activeNotePath={activeNotePath}
          dirtyNotes={dirtyNotes}
          pendingRenameFolder={pendingRenameFolder}
          pendingRenameNote={pendingRenameNote}
          onCreateNote={onCreateNote}
          onCreateFolder={onCreateFolder}
          onPendingRenameFolderHandled={onPendingRenameFolderHandled}
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
          vaultName={vaultName}
          vaultPath={vaultPath}
          isCollapsed={isCollapsed}
          onSwitchVault={onSwitchVault}
          onOpenFolderPicker={onOpenFolderPicker}
          onCreateNewVault={onCreateNewVault}
          onOpenVaultFromDrive={onOpenVaultFromDrive}
          onSyncVault={onSyncVault}
          onOpenSettings={onOpenSettings}
          onOpenHelp={onOpenHelp}
          onOpenLogs={onOpenLogs}
        />
      </div>

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
