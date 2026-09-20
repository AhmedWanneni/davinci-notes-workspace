import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getMappedIcon } from "../../icons/iconMap";
import { buildTreeFromPaths, flattenVisibleTree } from "./tree-utils";
import { FileTreeContextMenu } from "./FileTreeContextMenu";
import { FileTreeEmojiPopover } from "./FileTreeEmojiPopover";
import { FileTreeRow } from "./FileTreeRow";
import { runTreeRename } from "./runTreeRename";
import { useFileTreeDrop } from "./useFileTreeDrop";
import { useFileTreeIcons } from "./useFileTreeIcons";
import { useFileTreeInlineRename } from "./useFileTreeInlineRename";
import { useFileTreeMenus } from "./useFileTreeMenus";
import { useTreeExpandedFolders } from "./useTreeExpandedFolders";
import type { FileTreeProps } from "./FileTreeProps";

export type { FileTreeProps };

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
  } = useFileTreeInlineRename({
    onRenameNote: (path, name) =>
      runTreeRename("note", () => onRenameNote?.(path, name)),
    onRenameFolder: (path, name) =>
      runTreeRename("folder", () => onRenameFolder?.(path, name)),
  });

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

  const { icons, setIcon } = useFileTreeIcons();
  const {
    contextMenu,
    iconTarget,
    openContextMenu,
    confirmDelete,
    closeContextMenu,
    closeIconPicker,
    openIconPicker,
  } = useFileTreeMenus({
    onDeleteNote,
    onDeleteFolder,
    onSelectedFolderChange,
  });

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
                icon={getMappedIcon(icons, item.node.path) ?? undefined}
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
                onIconClick={(event) =>
                  openIconPicker(item.node.path, event)
                }
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
          onClose={closeContextMenu}
        />
      )}
      {iconTarget && (
        <FileTreeEmojiPopover
          x={iconTarget.x}
          y={iconTarget.y}
          onClose={closeIconPicker}
          onSelect={(emoji) => {
            setIcon(iconTarget.path, emoji);
            closeIconPicker();
          }}
        />
      )}
    </>
  );
}
