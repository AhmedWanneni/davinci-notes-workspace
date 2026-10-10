import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  buildTreeFromPaths,
  flattenVisibleTree,
  getAllFolderPaths,
  type TreeSortOrder,
} from "./tree-utils";
import { FileTreeList } from "./FileTreeList";
import { FileTreeOverlays } from "./FileTreeOverlays";
import { FileTreeToolbar } from "./FileTreeToolbar";
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
  const [sortOrder, setSortOrder] = useState<TreeSortOrder>("name-asc");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

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

  const {
    expandedFolders,
    toggleFolder,
    expandFolder,
    collapseAll,
    expandAll,
  } = useTreeExpandedFolders({
    activePath,
    pendingRenameFolder,
    pendingRenameNote,
    onSelectedFolderChange: (folder) => {
      setSelectedFolder(folder);
      onSelectedFolderChange?.(folder);
    },
    onStartRename: startRename,
    onPendingRenameHandled,
    onPendingRenameNoteHandled,
  });

  const tree = useMemo(
    () => buildTreeFromPaths(filePaths, folderPaths, sortOrder),
    [filePaths, folderPaths, sortOrder],
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
      <div className="file-tree-container">
        <FileTreeToolbar
          onCreateNote={() => void onCreateNote?.(selectedFolder ?? undefined)}
          onCreateFolder={() => void onCreateFolder(selectedFolder ?? "")}
          sortOrder={sortOrder}
          onToggleSort={() =>
            setSortOrder((prev) =>
              prev === "name-asc" ? "name-desc" : "name-asc",
            )
          }
          onCollapseAll={collapseAll}
          onExpandAll={() => expandAll(getAllFolderPaths(tree))}
        />
        <FileTreeList
          parentRef={parentRef}
          dropTargetFolder={dropTargetFolder}
          openContextMenu={openContextMenu}
          handleDragEnter={handleDragEnter}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleDragStart={handleDragStart}
          rowVirtualizer={rowVirtualizer}
          visibleNodes={visibleNodes}
          activePath={activePath}
          dirtyPaths={dirtyPaths}
          icons={icons}
          draggedPath={draggedPath}
          expandedFolders={expandedFolders}
          renamingPath={renamingPath}
          renamingKind={renamingKind}
          draftStem={draftStem}
          setDraftStem={setDraftStem}
          commitRename={commitRename}
          cancelRename={cancelRename}
          onNoteClick={(path) => {
            onNoteClick(path);
            setSelectedFolder(null);
            onSelectedFolderChange?.(null);
          }}
          onFolderClick={toggleFolder}
          openIconPicker={openIconPicker}
          startRename={startRename}
          confirmDelete={confirmDelete}
          hasRenameNote={!!onRenameNote}
          hasRenameFolder={!!onRenameFolder}
        />
      </div>
      <FileTreeOverlays
        contextMenu={contextMenu}
        iconTarget={iconTarget}
        onNoteClick={onNoteClick}
        onCreateNote={onCreateNote}
        onCreateFolder={onCreateFolder}
        onStartRename={startRename}
        onDuplicateNote={onDuplicateNote}
        onConfirmDelete={confirmDelete}
        onCloseContextMenu={closeContextMenu}
        onCloseIconPicker={closeIconPicker}
        onSetIcon={setIcon}
      />
    </>
  );
}
