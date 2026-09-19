import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { buildTreeFromPaths, flattenVisibleTree } from "./tree-utils";
import {
  FileTreeContextMenu,
  type FileTreeMenuTargetType,
} from "./FileTreeContextMenu";
import { FileTreeRow } from "./FileTreeRow";
import { isHiddenOrSystemPath } from "./getDropEffect";
import { useFileTreeDrop } from "./useFileTreeDrop";
import { useFileTreeInlineRename } from "./useFileTreeInlineRename";
import { useTreeExpandedFolders } from "./useTreeExpandedFolders";

interface FileTreeProps {
  filePaths: string[];
  folderPaths: string[];
  activePath: string | null;
  dirtyPaths: Set<string>;
  pendingRenameFolder?: string | null;
  pendingRenameNote?: string | null;
  onNoteClick: (path: string) => void;
  onCreateNote?: (parentFolder?: string) => void | Promise<unknown>;
  onCreateFolder: (parentFolder: string) => Promise<string | null>;
  onPendingRenameHandled?: () => void;
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
}

export function FileTree({
  filePaths,
  folderPaths,
  activePath,
  dirtyPaths,
  pendingRenameFolder,
  pendingRenameNote,
  onNoteClick,
  onCreateNote,
  onCreateFolder,
  onPendingRenameHandled,
  onPendingRenameNoteHandled,
  onRenameNote,
  onRenameFolder,
  onDeleteNote,
  onDeleteFolder,
  onDuplicateNote,
  onMoveNote,
  onMoveFile,
  onDropFiles,
  onSelectedFolderChange,
}: FileTreeProps) {
  const {
    renamingPath,
    renamingKind,
    draftStem,
    setDraftStem,
    startRename,
    cancelRename,
    commitRename,
  } = useFileTreeInlineRename({ onRenameNote, onRenameFolder });

  const { expandedFolders, toggleFolder, expandFolder } =
    useTreeExpandedFolders({
      activePath,
      pendingRenameFolder,
      pendingRenameNote,
      onSelectedFolderChange,
      onStartRename: startRename,
      onPendingRenameHandled,
      onPendingRenameNoteHandled,
    });

  const tree = useMemo(
    () => buildTreeFromPaths(filePaths, folderPaths),
    [filePaths, folderPaths],
  );

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    targetType: FileTreeMenuTargetType;
    targetPath: string;
  } | null>(null);

  const visibleNodes = useMemo(
    () => flattenVisibleTree(tree, expandedFolders),
    [tree, expandedFolders],
  );

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: visibleNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 10,
  });

  const {
    draggedPath,
    dropTargetFolder,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useFileTreeDrop({
    onMoveNote,
    onMoveFile,
    onDropFiles,
    onExpandFolder: expandFolder,
  });

  const openContextMenu = (
    e: React.MouseEvent,
    targetType: FileTreeMenuTargetType,
    targetPath: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (targetPath && isHiddenOrSystemPath(targetPath)) return;
    setContextMenu({ x: e.clientX, y: e.clientY, targetType, targetPath });
  };

  const confirmDelete = async (path: string, isFolder: boolean) => {
    const msg = isFolder
      ? `Delete folder "${path}" and all its contents? This cannot be undone.`
      : `Delete "${path}" from vault? This cannot be undone.`;
    if (window.confirm(msg)) {
      if (isFolder) await onDeleteFolder?.(path);
      else await onDeleteNote?.(path);
    }
  };

  return (
    <>
      <div
        className="file-tree"
        ref={parentRef}
        data-drop-root={dropTargetFolder === "" || undefined}
        onContextMenu={(e) => openContextMenu(e, "root", "")}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className="file-tree__virtual-inner"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const item = visibleNodes[virtualItem.index];
            const isFile = item.node.type === "file";
            const isFolder = !isFile;
            const isRenaming =
              renamingPath === item.node.path &&
              ((isFile && renamingKind === "note") ||
                (isFolder && renamingKind === "folder"));

            return (
              <FileTreeRow
                key={virtualItem.key}
                item={item}
                top={virtualItem.start}
                height={virtualItem.size}
                isActive={isFile && item.node.path === activePath}
                isDirty={isFile && dirtyPaths.has(item.node.path)}
                isDragging={item.node.path === draggedPath}
                isDropTarget={isFolder && item.node.path === dropTargetFolder}
                isExpanded={isFolder && expandedFolders.has(item.node.path)}
                isRenaming={isRenaming}
                draftStem={draftStem}
                onDraftStemChange={setDraftStem}
                onCommitRename={() => void commitRename()}
                onCancelRename={cancelRename}
                onDragStart={handleDragStart}
                onClick={() => {
                  if (isFile) {
                    onNoteClick(item.node.path);
                    onSelectedFolderChange?.(null);
                  } else {
                    toggleFolder(item.node.path);
                  }
                }}
                onContextMenu={(e) =>
                  openContextMenu(e, isFile ? "file" : "folder", item.node.path)
                }
                onDoubleClick={(e) => {
                  if (
                    isFile &&
                    item.node.path.endsWith(".md") &&
                    onRenameNote
                  ) {
                    e.stopPropagation();
                    startRename(item.node.path, "note");
                  } else if (isFolder && onRenameFolder) {
                    e.stopPropagation();
                    startRename(item.node.path, "folder");
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "F2") {
                    e.preventDefault();
                    if (isFile && onRenameNote)
                      startRename(item.node.path, "note");
                    else if (isFolder && onRenameFolder)
                      startRename(item.node.path, "folder");
                  } else if (
                    e.key === "Delete" ||
                    (e.key === "Backspace" && (e.metaKey || e.ctrlKey))
                  ) {
                    e.preventDefault();
                    void confirmDelete(item.node.path, isFolder);
                  }
                }}
              />
            );
          })}
        </div>
      </div>
      {contextMenu && (
        <FileTreeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetType={contextMenu.targetType}
          targetPath={contextMenu.targetPath}
          onOpenNote={onNoteClick}
          onNewNote={(parentFolder) => void onCreateNote?.(parentFolder)}
          onNewFolder={onCreateFolder}
          onRenameNote={(path) => startRename(path, "note")}
          onRenameFolder={(path) => startRename(path, "folder")}
          onDuplicateNote={onDuplicateNote}
          onDeleteNote={(path) => void confirmDelete(path, false)}
          onDeleteFolder={(path) => void confirmDelete(path, true)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
