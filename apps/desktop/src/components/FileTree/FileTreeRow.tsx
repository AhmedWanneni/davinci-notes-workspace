import {
  CaretDown,
  CaretRight,
  FileText,
  FrameCorners,
  Image,
  Video,
} from "@phosphor-icons/react";
import { updateDragPreview } from "./fileTreeDragPreview";
import { setActiveDraggedNode } from "./getDropEffect";
import type { FlatTreeNode } from "./tree-utils";

interface FileTreeRowProps {
  item: FlatTreeNode;
  top: number;
  height: number;
  isActive: boolean;
  isDirty: boolean;
  icon?: string;
  isDragging?: boolean;
  isDropTarget?: boolean;
  isExpanded: boolean;
  isRenaming: boolean;
  draftStem: string;
  onDraftStemChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onClick: () => void;
  onIconClick?: (event: React.MouseEvent) => void;
  onContextMenu: (event: React.MouseEvent) => void;
  onDoubleClick: (event: React.MouseEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onDragStart?: (path: string) => void;
  onDragEnter?: (event: React.DragEvent) => void;
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
  icon,
  isDragging,
  isDropTarget,
  isExpanded,
  isRenaming,
  draftStem,
  onDraftStemChange,
  onCommitRename,
  onCancelRename,
  onClick,
  onIconClick,
  onContextMenu,
  onDoubleClick,
  onKeyDown,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop,
}: FileTreeRowProps) {
  const isFile = item.node.type === "file";
  const displayTitle = item.node.name.replace(/\.(md|canvas)$/i, "");
  const isConflict = Boolean(
    isFile && item.node.path && /\.sync-conflict-[^/]+$/i.test(item.node.path),
  );

  return (
    <div
      className="file-tree__row"
      data-path={item.node.path}
      data-type={item.node.type}
      data-name={item.node.name}
      data-active={isActive || undefined}
      data-is-dragging={isDragging || undefined}
      data-drop-target={isDropTarget || undefined}
      data-is-conflict={isConflict || undefined}
      draggable={!isRenaming}
      tabIndex={0}
      onKeyDown={(event) => {
        if (!isRenaming) {
          onKeyDown?.(event);
        }
      }}
      onDragStart={(event) => {
        if (isRenaming) {
          event.preventDefault();
          return;
        }
        const target = event.currentTarget;
        const path = target.getAttribute("data-path") || item.node.path;
        const name = target.getAttribute("data-name") || item.node.name;
        const type =
          (target.getAttribute("data-type") as "file" | "folder") ||
          item.node.type;

        setActiveDraggedNode({ path, isFolder: type === "folder" });

        event.dataTransfer.setData("application/vnd.davinci.note", path);
        event.dataTransfer.setData("text/plain", path);
        event.dataTransfer.effectAllowed = "move";

        const previewEl = updateDragPreview({ name, type, path });
        if (typeof event.dataTransfer.setDragImage === "function") {
          event.dataTransfer.setDragImage(previewEl, 12, 14);
        }

        // Dim source row in next frame so the dim is not captured in the drag preview snapshot
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(() => {
            onDragStart?.(path);
          });
        } else {
          onDragStart?.(path);
        }
      }}
      onDragEnd={() => {
        setActiveDraggedNode(null);
      }}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDrop={onDrop}
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
      <button
        type="button"
        className="file-tree__icon"
        aria-label={`Change icon for ${item.node.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onIconClick?.(event);
        }}
      >
        {icon ? (
          <span className="file-tree__emoji" aria-hidden="true">
            {icon}
          </span>
        ) : isFile ? (
          fileIcon(item.node.name)
        ) : isExpanded ? (
          <CaretDown size={14} weight="bold" className="file-tree__caret" />
        ) : (
          <CaretRight size={14} weight="bold" className="file-tree__caret" />
        )}
      </button>
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
