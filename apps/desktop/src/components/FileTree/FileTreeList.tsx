import type { RefObject } from "react";
import type { Virtualizer } from "@tanstack/react-virtual";
import { getMappedIcon } from "../../icons/iconMap";
import { FileTreeRow } from "./FileTreeRow";
import type { FlatTreeNode } from "./tree-utils";
import { useBookmarks } from "../../bookmarks";

export interface FileTreeListProps {
  parentRef: RefObject<HTMLDivElement | null>;
  dropTargetFolder: string | null;
  openContextMenu: (
    e: React.MouseEvent,
    type: "file" | "folder" | "root",
    path: string,
  ) => void;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragStart: (path: string) => void;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  visibleNodes: FlatTreeNode[];
  activePath: string | null;
  dirtyPaths: Set<string>;
  icons: Record<string, string>;
  draggedPath: string | null;
  expandedFolders: Set<string>;
  renamingPath: string | null;
  renamingKind: "note" | "folder" | null;
  draftStem: string;
  setDraftStem: (val: string) => void;
  commitRename: () => Promise<void>;
  cancelRename: () => void;
  onNoteClick: (path: string) => void;
  onFolderClick: (path: string) => void;
  openIconPicker: (path: string, e: React.MouseEvent) => void;
  startRename: (path: string, kind: "note" | "folder") => void;
  confirmDelete: (path: string, isFolder: boolean) => Promise<void>;
  hasRenameNote: boolean;
  hasRenameFolder: boolean;
}

export function FileTreeList({
  parentRef,
  dropTargetFolder,
  openContextMenu,
  handleDragEnter,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleDragStart,
  rowVirtualizer,
  visibleNodes,
  activePath,
  dirtyPaths,
  icons,
  draggedPath,
  expandedFolders,
  renamingPath,
  renamingKind,
  draftStem,
  setDraftStem,
  commitRename,
  cancelRename,
  onNoteClick,
  onFolderClick,
  openIconPicker,
  startRename,
  confirmDelete,
  hasRenameNote,
  hasRenameFolder,
}: FileTreeListProps) {
  const { isBookmarked } = useBookmarks();
  return (
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
              isBookmarked={isFile && isBookmarked(item.node.path)}
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
                } else {
                  onFolderClick(item.node.path);
                }
              }}
              onIconClick={(event) => openIconPicker(item.node.path, event)}
              onContextMenu={(e) =>
                openContextMenu(e, isFile ? "file" : "folder", item.node.path)
              }
              onDoubleClick={(e) => {
                if (isFile && item.node.path.endsWith(".md") && hasRenameNote) {
                  e.stopPropagation();
                  startRename(item.node.path, "note");
                } else if (isFolder && hasRenameFolder) {
                  e.stopPropagation();
                  startRename(item.node.path, "folder");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "F2") {
                  e.preventDefault();
                  if (isFile && hasRenameNote) {
                    startRename(item.node.path, "note");
                  } else if (isFolder && hasRenameFolder) {
                    startRename(item.node.path, "folder");
                  }
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
  );
}
