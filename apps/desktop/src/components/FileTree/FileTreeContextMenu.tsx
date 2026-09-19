import { useEffect, useRef } from "react";

interface FileTreeContextMenuProps {
  x: number;
  y: number;
  parentFolder: string;
  notePath?: string;
  onOpenNote?: (path: string) => void;
  onRenameNote?: (path: string) => void;
  onCreateFolder: (parentFolder: string) => Promise<string | null>;
  onDuplicateNote?: (path: string) => void | Promise<unknown>;
  onDeleteNote?: (path: string) => void | Promise<unknown>;
  onClose: () => void;
}

export function FileTreeContextMenu({
  x,
  y,
  parentFolder,
  notePath,
  onOpenNote,
  onRenameNote,
  onCreateFolder,
  onDuplicateNote,
  onDeleteNote,
  onClose,
}: FileTreeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousActiveElementRef.current =
      document.activeElement as HTMLElement | null;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    const handleBlur = () => {
      onClose();
    };

    const handleScroll = (event: Event) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Capture phase ensures we intercept clicks on drag-regions before Tauri swallows them
    document.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
    });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("scroll", handleScroll, {
        capture: true,
      });
      previousActiveElementRef.current?.focus?.();
    };
  }, [onClose]);

  const handleNoteAction = (
    action: (path: string) => void | Promise<unknown>,
  ) => {
    if (!notePath) {
      return;
    }
    void action(notePath);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="file-tree__context-menu"
      style={{ top: y, left: x }}
      role="menu"
    >
      {notePath && onOpenNote && (
        <button
          type="button"
          className="file-tree__context-menu-item"
          role="menuitem"
          onClick={() => handleNoteAction(onOpenNote)}
        >
          Open
        </button>
      )}
      {notePath && onRenameNote && (
        <button
          type="button"
          className="file-tree__context-menu-item"
          role="menuitem"
          onClick={() => handleNoteAction(onRenameNote)}
        >
          Rename
        </button>
      )}
      {notePath && onDuplicateNote && (
        <button
          type="button"
          className="file-tree__context-menu-item"
          role="menuitem"
          onClick={() => handleNoteAction(onDuplicateNote)}
        >
          Duplicate
        </button>
      )}
      {notePath && onDeleteNote && (
        <button
          type="button"
          className="file-tree__context-menu-item"
          role="menuitem"
          onClick={() => handleNoteAction(onDeleteNote)}
        >
          Remove
        </button>
      )}
      <button
        type="button"
        className="file-tree__context-menu-item"
        role="menuitem"
        onClick={() => {
          void onCreateFolder(parentFolder);
          onClose();
        }}
      >
        New folder
      </button>
    </div>
  );
}
