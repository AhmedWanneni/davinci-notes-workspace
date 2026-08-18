interface FileTreeContextMenuProps {
  x: number;
  y: number;
  parentFolder: string;
  onCreateFolder: (parentFolder: string) => Promise<string | null>;
  onClose: () => void;
}

export function FileTreeContextMenu({
  x,
  y,
  parentFolder,
  onCreateFolder,
  onClose,
}: FileTreeContextMenuProps) {
  return (
    <div
      className="file-tree__context-menu"
      style={{ top: y, left: x }}
      role="menu"
    >
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
