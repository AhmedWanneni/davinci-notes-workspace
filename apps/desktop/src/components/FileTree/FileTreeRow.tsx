import {
  CaretDown,
  CaretRight,
  FileText,
  FrameCorners,
  Image,
  Video,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { FlatTreeNode } from "./tree-utils";

interface FileTreeRowProps {
  item: FlatTreeNode;
  top: number;
  height: number;
  isActive: boolean;
  isDirty: boolean;
  isExpanded: boolean;
  isRenaming: boolean;
  draftStem: string;
  onDraftStemChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onClick: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
  onDoubleClick: (event: React.MouseEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
}

function fileIcon(name: string) {
  if (name.endsWith(".canvas")) {
    return <FrameCorners size={14} className="file-tree__file-icon" />;
  }
  if (/\.(png|jpe?g|gif|svg|webp|bmp|ico|avif)$/i.test(name)) {
    return <Image size={14} className="file-tree__file-icon" />;
  }
  if (/\.(mp4|webm|og[gv]|mov|mkv|m4v)$/i.test(name)) {
    return <Video size={14} className="file-tree__file-icon" />;
  }
  return <FileText size={14} className="file-tree__file-icon" />;
}

export function FileTreeRow({
  item,
  top,
  height,
  isActive,
  isDirty,
  isExpanded,
  isRenaming,
  draftStem,
  onDraftStemChange,
  onCommitRename,
  onCancelRename,
  onClick,
  onContextMenu,
  onDoubleClick,
  onDragOver,
  onDrop,
}: FileTreeRowProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isFile = item.node.type === "file";
  const displayTitle = item.node.name.replace(/\.(md|canvas)$/i, "");
  const isConflict = Boolean(
    isFile && item.node.path && /\.sync-conflict-[^/]+$/i.test(item.node.path),
  );

  return (
    <div
      className="file-tree__row"
      data-active={isActive || undefined}
      data-drag-over={isDragOver || undefined}
      data-is-conflict={isConflict || undefined}
      draggable={isFile}
      onDragStart={(event) => {
        if (!isFile) {
          return;
        }
        event.dataTransfer.setData(
          "application/vnd.davinci.note",
          item.node.path,
        );
        event.dataTransfer.setData("text/plain", item.node.path);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        if (isFile) {
          return;
        }
        event.preventDefault();
        setIsDragOver(true);
        onDragOver?.(event);
      }}
      onDragLeave={() => {
        setIsDragOver(false);
      }}
      onDrop={(event) => {
        setIsDragOver(false);
        if (isFile) {
          return;
        }
        onDrop?.(event);
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: `${height}px`,
        transform: `translateY(${top}px)`,
        paddingLeft: `calc(var(--space-2) + ${item.depth * 16}px)`,
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
    >
      <span className="file-tree__icon">
        {isFile ? (
          fileIcon(item.node.name)
        ) : isExpanded ? (
          <CaretDown size={14} weight="bold" className="file-tree__caret" />
        ) : (
          <CaretRight size={14} weight="bold" className="file-tree__caret" />
        )}
      </span>
      <span className="file-tree__title" title={item.node.name}>
        {isRenaming ? (
          <input
            className="file-tree__rename-input"
            value={draftStem}
            autoFocus
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onDraftStemChange(event.target.value)}
            onBlur={onCommitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onCommitRename();
              } else if (event.key === "Escape") {
                event.preventDefault();
                onCancelRename();
              }
            }}
          />
        ) : (
          displayTitle
        )}
      </span>
      {isConflict && <span className="file-tree__conflict-chip">Conflict</span>}
      {isDirty && <span className="file-tree__dirty-dot" />}
    </div>
  );
}
