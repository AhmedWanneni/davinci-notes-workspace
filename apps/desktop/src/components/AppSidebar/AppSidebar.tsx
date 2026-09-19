import { FilePlus, FolderPlus, FrameCorners } from "@phosphor-icons/react";
import { type ReactNode, useState } from "react";
import { Tooltip, Typography } from "@app/design-system";
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
  isMac: boolean;
  onCreateNote: () => void;
  onCreateFolder: (parentFolder?: string) => Promise<string | null>;
  onCreateCanvas?: () => void;
  onNoteClick: (path: string) => void;
  onRenameNote?: (oldPath: string, newStem: string) => Promise<boolean>;
  onRenameFolder?: (oldPath: string, newName: string) => Promise<boolean>;
  onDeleteNote?: (path: string) => Promise<boolean>;
  onDuplicateNote?: (path: string) => Promise<boolean>;
  onMoveNote?: (path: string, newParentFolder: string) => Promise<boolean>;
  onMoveFile?: (path: string, newParentFolder: string) => Promise<boolean>;
  onDropFiles?: (targetFolder: string, files: readonly File[]) => Promise<void>;
  onSelectedFolderChange?: (folderPath: string | null) => void;
  pendingRenameFolder?: string | null;
  onPendingRenameFolderHandled?: () => void;
}

export function AppSidebar({
  vaultName,
  allNotePaths,
  allFolderPaths,
  activeNotePath,
  dirtyNotes,
  log,
  navigation,
  isCollapsed,
  isMac,
  onCreateNote,
  onCreateFolder,
  onCreateCanvas,
  onNoteClick,
  onRenameNote,
  onRenameFolder,
  onDeleteNote,
  onDuplicateNote,
  onMoveNote,
  onMoveFile,
  onDropFiles,
  onSelectedFolderChange,
  pendingRenameFolder,
  onPendingRenameFolderHandled,
}: AppSidebarProps) {
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(
    null,
  );

  const handleSelectedFolderChange = (folderPath: string | null) => {
    setSelectedFolderPath(folderPath);
    onSelectedFolderChange?.(folderPath);
  };
  return (
    <aside
      className="app-sidebar"
      data-collapsed={isCollapsed || undefined}
      aria-label="File Explorer"
    >
      <div className="app-sidebar__header">
        {isMac ? (
          <div className="app-sidebar__traffic-light-spacer" />
        ) : (
          <WindowControls />
        )}
        <div
          className="app-sidebar__drag-region"
          data-tauri-drag-region
          onDoubleClick={() => void getCurrentWindow().toggleMaximize()}
        />
        <div className="app-sidebar__vault-title">
          <Typography
            variant="text"
            size="sm"
            weight="semibold"
            className="app-sidebar__title"
          >
            {vaultName}
          </Typography>
        </div>
        <div className="app-sidebar__header-actions">
          <Tooltip content="New note" contentProps={{ side: "bottom" }}>
            <button
              type="button"
              className="app-sidebar__action-btn"
              onClick={onCreateNote}
              aria-label="New note"
            >
              <FilePlus size={16} />
            </button>
          </Tooltip>
          <Tooltip content="New folder" contentProps={{ side: "bottom" }}>
            <button
              type="button"
              className="app-sidebar__action-btn"
              onClick={() => void onCreateFolder(selectedFolderPath ?? "")}
              aria-label="New folder"
            >
              <FolderPlus size={16} />
            </button>
          </Tooltip>
          {onCreateCanvas && (
            <Tooltip content="New canvas" contentProps={{ side: "bottom" }}>
              <button
                type="button"
                className="app-sidebar__action-btn"
                onClick={onCreateCanvas}
                aria-label="New canvas"
              >
                <FrameCorners size={16} />
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
          onNoteClick={onNoteClick}
          onCreateFolder={onCreateFolder}
          onPendingRenameHandled={onPendingRenameFolderHandled}
          onRenameNote={onRenameNote}
          onRenameFolder={onRenameFolder}
          onDeleteNote={onDeleteNote}
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
