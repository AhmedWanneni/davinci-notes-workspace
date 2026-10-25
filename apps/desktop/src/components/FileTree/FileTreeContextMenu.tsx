import { useRef } from "react";
import { useContextMenuDismiss } from "./useContextMenuDismiss";

export type FileTreeMenuTargetType = "file" | "folder" | "root";

export interface FileTreeContextMenuProps {
  x: number;
  y: number;
  targetType: FileTreeMenuTargetType;
  targetPath: string;
  onOpenNote?: (path: string) => void;
  onNewNote: (parentFolder: string) => void;
  onNewFolder: (parentFolder: string) => void;
  onRenameNote?: (path: string) => void;
  onRenameFolder?: (path: string) => void;
  onDuplicateNote?: (path: string) => void;
  onDeleteNote?: (path: string) => void;
  onDeleteFolder?: (path: string) => void;
  isBookmarked?: boolean;
  onToggleBookmark?: (path: string) => void;
  onClose: () => void;
}

export function FileTreeContextMenu({
  x,
  y,
  targetType,
  targetPath,
  onOpenNote,
  onNewNote,
  onNewFolder,
  onRenameNote,
  onRenameFolder,
  onDuplicateNote,
  onDeleteNote,
  onDeleteFolder,
  isBookmarked,
  onToggleBookmark,
  onClose,
}: FileTreeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  useContextMenuDismiss({ menuRef, onClose });

  const clampedX =
    typeof window !== "undefined"
      ? Math.max(8, Math.min(x, window.innerWidth - 180))
      : x;
  const clampedY =
    typeof window !== "undefined"
      ? Math.max(8, Math.min(y, window.innerHeight - 220))
      : y;

  return (
    <div
      ref={menuRef}
      className="file-tree__context-menu"
      style={{ top: clampedY, left: clampedX }}
      role="menu"
      aria-label="File actions"
    >
      {targetType === "file" && (
        <>
          {onOpenNote && (
            <button
              type="button"
              className="file-tree__context-menu-item"
              role="menuitem"
              onClick={() => {
                onOpenNote(targetPath);
                onClose();
              }}
            >
              <span>Open</span>
            </button>
          )}
          {onRenameNote && (
            <button
              type="button"
              className="file-tree__context-menu-item"
              role="menuitem"
              onClick={() => {
                onRenameNote(targetPath);
                onClose();
              }}
            >
              <span>Rename</span>
              <span className="file-tree__context-menu-shortcut">F2</span>
            </button>
          )}
          {onDuplicateNote && (
            <button
              type="button"
              className="file-tree__context-menu-item"
              role="menuitem"
              onClick={() => {
                onDuplicateNote(targetPath);
                onClose();
              }}
            >
              <span>Duplicate</span>
            </button>
          )}
          {onToggleBookmark && (
            <button
              type="button"
              className="file-tree__context-menu-item"
              role="menuitem"
              onClick={() => {
                onToggleBookmark(targetPath);
                onClose();
              }}
            >
              <span>{isBookmarked ? "Remove bookmark" : "Bookmark note"}</span>
            </button>
          )}
          {onDeleteNote && (
            <>
              <div
                className="file-tree__context-menu-separator"
                role="separator"
              />
              <button
                type="button"
                className="file-tree__context-menu-item file-tree__context-menu-item--danger"
                role="menuitem"
                onClick={() => {
                  onDeleteNote(targetPath);
                  onClose();
                }}
              >
                <span>Delete</span>
                <span className="file-tree__context-menu-shortcut">⌫</span>
              </button>
            </>
          )}
        </>
      )}

      {targetType === "folder" && (
        <>
          <button
            type="button"
            className="file-tree__context-menu-item"
            role="menuitem"
            onClick={() => {
              onNewNote(targetPath);
              onClose();
            }}
          >
            <span>New note</span>
          </button>
          <button
            type="button"
            className="file-tree__context-menu-item"
            role="menuitem"
            onClick={() => {
              onNewFolder(targetPath);
              onClose();
            }}
          >
            <span>New folder</span>
          </button>
          {(onRenameFolder || onDeleteFolder) && (
            <div
              className="file-tree__context-menu-separator"
              role="separator"
            />
          )}
          {onRenameFolder && (
            <button
              type="button"
              className="file-tree__context-menu-item"
              role="menuitem"
              onClick={() => {
                onRenameFolder(targetPath);
                onClose();
              }}
            >
              <span>Rename</span>
              <span className="file-tree__context-menu-shortcut">F2</span>
            </button>
          )}
          {onDeleteFolder && (
            <button
              type="button"
              className="file-tree__context-menu-item file-tree__context-menu-item--danger"
              role="menuitem"
              onClick={() => {
                onDeleteFolder(targetPath);
                onClose();
              }}
            >
              <span>Delete</span>
              <span className="file-tree__context-menu-shortcut">⌫</span>
            </button>
          )}
        </>
      )}

      {targetType === "root" && (
        <>
          <button
            type="button"
            className="file-tree__context-menu-item"
            role="menuitem"
            onClick={() => {
              onNewNote("");
              onClose();
            }}
          >
            <span>New note</span>
          </button>
          <button
            type="button"
            className="file-tree__context-menu-item"
            role="menuitem"
            onClick={() => {
              onNewFolder("");
              onClose();
            }}
          >
            <span>New folder</span>
          </button>
        </>
      )}
    </div>
  );
}
