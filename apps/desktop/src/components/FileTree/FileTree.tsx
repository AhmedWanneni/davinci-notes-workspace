import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { buildTreeFromPaths, flattenVisibleTree } from "./tree-utils";
import { FileTreeContextMenu } from "./FileTreeContextMenu";
import { FileTreeRow } from "./FileTreeRow";
import { getParentFolder } from "./getDropEffect";
import { useFileTreeDrop } from "./useFileTreeDrop";
import { useFileTreeInlineRename } from "./useFileTreeInlineRename";

interface FileTreeProps {
  filePaths: string[];
  folderPaths: string[];
  activePath: string | null;
  dirtyPaths: Set<string>;
  pendingRenameFolder?: string | null;
  onNoteClick: (path: string) => void;
  onCreateFolder: (parentFolder: string) => Promise<string | null>;
  onPendingRenameHandled?: () => void;
  onRenameNote?: (oldPath: string, newStem: string) => Promise<boolean>;
  onRenameFolder?: (oldPath: string, newName: string) => Promise<boolean>;
  onDeleteNote?: (path: string) => Promise<boolean>;
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
  onNoteClick,
  onCreateFolder,
  onPendingRenameHandled,
  onRenameNote,
  onRenameFolder,
  onDeleteNote,
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
  const tree = useMemo(
    () => buildTreeFromPaths(filePaths, folderPaths),
    [filePaths, folderPaths],
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set(),
  );
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    parentFolder: string;
    notePath?: string;
  } | null>(null);

  useEffect(() => {
    if (!pendingRenameFolder) return;
    const parent = getParentFolder(pendingRenameFolder);
    if (parent) setExpandedFolders((prev) => new Set(prev).add(parent));
    startRename(pendingRenameFolder, "folder");
    onPendingRenameHandled?.();
  }, [pendingRenameFolder, onPendingRenameHandled, startRename]);

  useEffect(() => {
    if (!activePath) return;
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      let changed = false;
      let currentPath = "";
      for (const part of activePath.split("/").slice(0, -1)) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (!next.has(currentPath)) {
          next.add(currentPath);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activePath]);

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
    onExpandFolder: (folderPath) => {
      setExpandedFolders((prev) => new Set(prev).add(folderPath));
    },
  });

  const openContextMenu = (
    e: React.MouseEvent,
    parentFolder: string,
    notePath?: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, parentFolder, notePath });
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
    onSelectedFolderChange?.(folderPath);
  };

  const confirmDeleteNote = async (path: string) => {
    if (
      window.confirm(`Delete "${path}" from the vault? This cannot be undone.`)
    ) {
      await onDeleteNote?.(path);
    }
  };

  return (
    <>
      <div
        className="file-tree"
        ref={parentRef}
        data-drop-root={dropTargetFolder === "" || undefined}
        onContextMenu={(e) => openContextMenu(e, "")}
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
                onContextMenu={(e) => {
                  if (isFile && item.node.path.endsWith(".md")) {
                    openContextMenu(
                      e,
                      getParentFolder(item.node.path),
                      item.node.path,
                    );
                  } else if (isFolder) {
                    openContextMenu(e, item.node.path);
                  }
                }}
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
              />
            );
          })}
        </div>
      </div>
      {contextMenu && (
        <FileTreeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          parentFolder={contextMenu.parentFolder}
          notePath={contextMenu.notePath}
          onOpenNote={onNoteClick}
          onRenameNote={(path) => startRename(path, "note")}
          onCreateFolder={onCreateFolder}
          onDuplicateNote={onDuplicateNote}
          onDeleteNote={confirmDeleteNote}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
