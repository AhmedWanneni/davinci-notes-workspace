import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  CaretRight,
  CaretDown,
  FileText,
  FrameCorners,
  Image,
  Video,
} from "@phosphor-icons/react";
import { buildTreeFromPaths, flattenVisibleTree } from "./tree-utils";
import { FileTreeContextMenu } from "./FileTreeContextMenu";
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
  } | null>(null);

  useEffect(() => {
    if (!pendingRenameFolder) {
      return;
    }
    const parent = pendingRenameFolder.includes("/")
      ? pendingRenameFolder.slice(0, pendingRenameFolder.lastIndexOf("/"))
      : "";
    if (parent) {
      setExpandedFolders((prev) => new Set(prev).add(parent));
    }
    startRename(pendingRenameFolder, "folder");
    onPendingRenameHandled?.();
  }, [pendingRenameFolder, onPendingRenameHandled, startRename]);

  useEffect(() => {
    if (!activePath) {
      return;
    }
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

  const openContextMenu = (
    e: React.MouseEvent,
    parentFolder: string,
  ) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, parentFolder });
  };

  return (
    <>
      <div
        className="file-tree"
        ref={parentRef}
        onContextMenu={(e) => openContextMenu(e, "")}
      >
        <div
          className="file-tree__virtual-inner"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const item = visibleNodes[virtualItem.index];
            const isFile = item.node.type === "file";
            const isFolder = !isFile;
            const isCanvas = isFile && item.node.name.endsWith(".canvas");
            const isImage =
              isFile &&
              /\.(png|jpe?g|gif|svg|webp|bmp|ico|avif)$/i.test(item.node.name);
            const isVideo =
              isFile &&
              /\.(mp4|webm|og[gv]|mov|mkv|m4v)$/i.test(item.node.name);
            const isActive = isFile && item.node.path === activePath;
            const isDirty = isFile && dirtyPaths.has(item.node.path);
            const isExpanded = isFolder && expandedFolders.has(item.node.path);
            const displayTitle = item.node.name.replace(/\.(md|canvas)$/i, "");
            const isRenaming =
              renamingPath === item.node.path &&
              ((isFile && renamingKind === "note") ||
                (isFolder && renamingKind === "folder"));

            return (
              <div
                key={virtualItem.key}
                className="file-tree__row"
                data-active={isActive || undefined}
                draggable={isFile}
                onDragStart={(e) => {
                  if (!isFile) {
                    return;
                  }
                  e.dataTransfer.setData(
                    "application/vnd.davinci.note",
                    item.node.path,
                  );
                  e.dataTransfer.setData("text/plain", item.node.path);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  paddingLeft: `calc(var(--space-2) + ${item.depth * 16}px)`,
                }}
                onClick={() => {
                  if (isFile) {
                    onNoteClick(item.node.path);
                    onSelectedFolderChange?.(null);
                    return;
                  }
                  setExpandedFolders((prev) => {
                    const next = new Set(prev);
                    if (next.has(item.node.path)) {
                      next.delete(item.node.path);
                    } else {
                      next.add(item.node.path);
                    }
                    return next;
                  });
                  onSelectedFolderChange?.(item.node.path);
                }}
                onContextMenu={(e) => {
                  if (isFolder) {
                    openContextMenu(e, item.node.path);
                  }
                }}
                onDoubleClick={(e) => {
                  if (isFile && item.node.path.endsWith(".md") && onRenameNote) {
                    e.stopPropagation();
                    startRename(item.node.path, "note");
                    return;
                  }
                  if (isFolder && onRenameFolder) {
                    e.stopPropagation();
                    startRename(item.node.path, "folder");
                  }
                }}
              >
                <span className="file-tree__icon">
                  {isFolder ? (
                    isExpanded ? (
                      <CaretDown
                        size={14}
                        weight="bold"
                        className="file-tree__caret"
                      />
                    ) : (
                      <CaretRight
                        size={14}
                        weight="bold"
                        className="file-tree__caret"
                      />
                    )
                  ) : isCanvas ? (
                    <FrameCorners size={14} className="file-tree__file-icon" />
                  ) : isImage ? (
                    <Image size={14} className="file-tree__file-icon" />
                  ) : isVideo ? (
                    <Video size={14} className="file-tree__file-icon" />
                  ) : (
                    <FileText size={14} className="file-tree__file-icon" />
                  )}
                </span>
                <span className="file-tree__title" title={item.node.name}>
                  {isRenaming ? (
                    <input
                      className="file-tree__rename-input"
                      value={draftStem}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setDraftStem(e.target.value)}
                      onBlur={() => void commitRename()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void commitRename();
                        } else if (e.key === "Escape") {
                          e.preventDefault();
                          cancelRename();
                        }
                      }}
                    />
                  ) : (
                    displayTitle
                  )}
                </span>
                {isDirty && <span className="file-tree__dirty-dot" />}
              </div>
            );
          })}
        </div>
      </div>
      {contextMenu && (
        <FileTreeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          parentFolder={contextMenu.parentFolder}
          onCreateFolder={(parent) => void onCreateFolder(parent)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}
