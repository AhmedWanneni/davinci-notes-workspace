import { FileTreeContextMenu } from "./FileTreeContextMenu";
import { FileTreeEmojiPopover } from "./FileTreeEmojiPopover";
import { useBookmarks } from "../../bookmarks";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import type {
  FileTreeContextMenuState,
  FileTreeIconTarget,
} from "./useFileTreeMenus";

export interface FileTreeOverlaysProps {
  contextMenu: FileTreeContextMenuState | null;
  iconTarget: FileTreeIconTarget | null;
  onNoteClick: (path: string) => void;
  onCreateNote?: (parentFolder?: string) => void | Promise<unknown>;
  onCreateFolder: (parentFolder: string) => Promise<string | null>;
  onOpenFolderGraph?: (folderPath: string) => void;
  onStartRename: (path: string, kind: "note" | "folder") => void;
  onDuplicateNote?: (path: string) => Promise<boolean>;
  onConfirmDelete: (path: string, isFolder: boolean) => Promise<void>;
  onCloseContextMenu: () => void;
  onCloseIconPicker: () => void;
  onSetIcon: (path: string, emoji: string) => void;
}

export function FileTreeOverlays({
  contextMenu,
  iconTarget,
  onNoteClick,
  onCreateNote,
  onCreateFolder,
  onOpenFolderGraph,
  onStartRename,
  onDuplicateNote,
  onConfirmDelete,
  onCloseContextMenu,
  onCloseIconPicker,
  onSetIcon,
}: FileTreeOverlaysProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const openFolderGraphInStore = useWorkspaceStore(
    (state) => state.openFolderGraph,
  );
  const handleOpenFolderGraph =
    onOpenFolderGraph ??
    ((folderPath: string) => {
      openFolderGraphInStore(folderPath);
    });
  return (
    <>
      {contextMenu && (
        <FileTreeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetType={contextMenu.targetType}
          targetPath={contextMenu.targetPath}
          onOpenNote={onNoteClick}
          onNewNote={(parentFolder) => void onCreateNote?.(parentFolder)}
          onNewFolder={onCreateFolder}
          onOpenFolderGraph={handleOpenFolderGraph}
          onRenameNote={(path) => onStartRename(path, "note")}
          onRenameFolder={(path) => onStartRename(path, "folder")}
          onDuplicateNote={onDuplicateNote}
          onDeleteNote={(path) => void onConfirmDelete(path, false)}
          onDeleteFolder={(path) => void onConfirmDelete(path, true)}
          isBookmarked={
            contextMenu.targetType === "file"
              ? isBookmarked(contextMenu.targetPath)
              : false
          }
          onToggleBookmark={(path) => void toggleBookmark(path)}
          onClose={onCloseContextMenu}
        />
      )}
      {iconTarget && (
        <FileTreeEmojiPopover
          x={iconTarget.x}
          y={iconTarget.y}
          onClose={onCloseIconPicker}
          onSelect={(emoji) => {
            onSetIcon(iconTarget.path, emoji);
            onCloseIconPicker();
          }}
        />
      )}
    </>
  );
}
