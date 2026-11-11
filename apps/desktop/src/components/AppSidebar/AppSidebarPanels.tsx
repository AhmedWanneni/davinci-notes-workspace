import { lazy, Suspense, type JSX } from "react";
import { FileTree } from "../FileTree";
import type { GitFileChange } from "@app/git-manager";

const LazyGitSidebarPanel = lazy(() =>
  import("@app/git-manager").then((m) => ({ default: m.GitSidebarPanel })),
);

const LazyBookmarksSidebarPanel = lazy(() =>
  import("../BookmarksView/BookmarksSidebarPanel").then((m) => ({
    default: m.BookmarksSidebarPanel,
  })),
);

const LazyAgentSidebarPanel = lazy(() =>
  import("../AgentView/AgentSidebarPanel").then((m) => ({
    default: m.AgentSidebarPanel,
  })),
);

const LazyTodosSidebarPanel = lazy(() =>
  import("../TodosView/TodosSidebarPanel").then((m) => ({
    default: m.TodosSidebarPanel,
  })),
);

const LazyMeetingsSidebar = lazy(() =>
  import("../ListeningView/MeetingsSidebar").then((m) => ({
    default: m.MeetingsSidebar,
  })),
);

export interface AppSidebarPanelsProps {
  isGitManagerOpen?: boolean;
  isBookmarksOpen?: boolean;
  isAgentPanelActive?: boolean;
  isTodosOpen?: boolean;
  isListeningOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  onNoteClick: (path: string) => void;
  allNotePaths: string[];
  allFolderPaths: string[];
  activeNotePath: string | null;
  dirtyNotes: Set<string>;
  pendingRenameFolder?: string | null;
  pendingRenameNote?: string | null;
  onCreateNote: (parentFolder?: string) => void | Promise<unknown>;
  onCreateFolder: (parentFolder?: string) => Promise<string | null>;
  onPendingRenameFolderHandled?: () => void;
  onPendingRenameNoteHandled?: () => void;
  onRenameNote?: (oldPath: string, newStem: string) => Promise<boolean>;
  onRenameFolder?: (oldPath: string, newName: string) => Promise<boolean>;
  onDeleteNote?: (path: string) => Promise<boolean>;
  onDeleteFolder?: (path: string) => Promise<boolean>;
  onDuplicateNote?: (path: string) => Promise<boolean>;
  onMoveNote?: (path: string, newParentFolder: string) => Promise<boolean>;
  onMoveFile?: (path: string, newParentFolder: string) => Promise<boolean>;
  onDropFiles?: (targetFolder: string, files: readonly File[]) => Promise<void>;
  onSelectedFolderChange?: (folderPath: string | null) => void;
  vaultName: string;
  vaultPath?: string | null;
  isCollapsed?: boolean;
  onSwitchVault?: (path: string) => void;
  onOpenFolderPicker?: () => void;
  onCreateNewVault?: () => void;
  onOpenVaultFromDrive?: () => void;
  onSyncVault?: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  onOpenLogs?: () => void;
}

export function AppSidebarPanels(props: AppSidebarPanelsProps): JSX.Element {
  if (props.isGitManagerOpen) {
    return (
      <Suspense fallback={<div style={{ padding: "var(--space-4)", color: "var(--color-text-muted)" }}>Loading Source Control...</div>}>
        <LazyGitSidebarPanel
          onOpenDiff={(change: GitFileChange) =>
            props.onNoteClick(`git-diff://${change.path}?staged=${change.staged ? "1" : "0"}&status=${change.statusCode}`)
          }
        />
      </Suspense>
    );
  }

  if (props.isBookmarksOpen) {
    return (
      <Suspense fallback={null}>
        <LazyBookmarksSidebarPanel />
      </Suspense>
    );
  }

  if (props.isAgentPanelActive) {
    return (
      <Suspense fallback={null}>
        <LazyAgentSidebarPanel onToggleSidebar={props.onToggleLeftSidebar} />
      </Suspense>
    );
  }

  if (props.isTodosOpen) {
    return (
      <Suspense fallback={null}>
        <LazyTodosSidebarPanel />
      </Suspense>
    );
  }

  if (props.isListeningOpen) {
    return (
      <Suspense fallback={null}>
        <LazyMeetingsSidebar inAppSidebar={true} />
      </Suspense>
    );
  }

  return (
    <FileTree
      filePaths={props.allNotePaths}
      folderPaths={props.allFolderPaths}
      activePath={props.activeNotePath}
      dirtyPaths={props.dirtyNotes}
      pendingRenameFolder={props.pendingRenameFolder}
      pendingRenameNote={props.pendingRenameNote}
      onNoteClick={props.onNoteClick}
      onCreateNote={props.onCreateNote}
      onCreateFolder={props.onCreateFolder}
      onPendingRenameHandled={props.onPendingRenameFolderHandled}
      onPendingRenameNoteHandled={props.onPendingRenameNoteHandled}
      onRenameNote={props.onRenameNote}
      onRenameFolder={props.onRenameFolder}
      onDeleteNote={props.onDeleteNote}
      onDeleteFolder={props.onDeleteFolder}
      onDuplicateNote={props.onDuplicateNote}
      onMoveNote={props.onMoveNote}
      onMoveFile={props.onMoveFile}
      onDropFiles={props.onDropFiles}
      onSelectedFolderChange={props.onSelectedFolderChange}
      vaultName={props.vaultName}
      vaultPath={props.vaultPath}
      isCollapsed={props.isCollapsed}
      onSwitchVault={props.onSwitchVault}
      onOpenFolderPicker={props.onOpenFolderPicker}
      onCreateNewVault={props.onCreateNewVault}
      onOpenVaultFromDrive={props.onOpenVaultFromDrive}
      onSyncVault={props.onSyncVault}
      onOpenSettings={props.onOpenSettings}
      onOpenHelp={props.onOpenHelp}
      onOpenLogs={props.onOpenLogs}
    />
  );
}
