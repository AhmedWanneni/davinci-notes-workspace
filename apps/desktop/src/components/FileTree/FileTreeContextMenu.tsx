interface FileTreeContextMenuProps {
  x: number;
  y: number;
  parentFolder: string;
  notePath?: string;
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
  onRenameNote,
  onCreateFolder,
  onDuplicateNote,
  onDeleteNote,
  onClose,
}: FileTreeContextMenuProps) {
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
      className="file-tree__context-menu"
      style={{ top: y, left: x }}
      role="menu"
    >
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
          Delete
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
