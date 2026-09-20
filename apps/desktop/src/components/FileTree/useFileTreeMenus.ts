import { useState } from "react";
import type { FileTreeMenuTargetType } from "./FileTreeContextMenu";
import { confirmTreeDelete } from "./confirmTreeDelete";
import { isHiddenOrSystemPath } from "./getDropEffect";

interface UseFileTreeMenusOptions {
  onDeleteNote?: (path: string) => Promise<boolean>;
  onDeleteFolder?: (path: string) => Promise<boolean>;
  onSelectedFolderChange?: (folderPath: string | null) => void;
}

export function useFileTreeMenus({
  onDeleteNote,
  onDeleteFolder,
  onSelectedFolderChange,
}: UseFileTreeMenusOptions) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    targetType: FileTreeMenuTargetType;
    targetPath: string;
  } | null>(null);
  const [iconTarget, setIconTarget] = useState<{
    path: string;
    x: number;
    y: number;
  } | null>(null);

  const openContextMenu = (
    event: React.MouseEvent,
    targetType: FileTreeMenuTargetType,
    targetPath: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (targetPath && isHiddenOrSystemPath(targetPath)) return;
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      targetType,
      targetPath,
    });
  };

  const confirmDelete = (path: string, isFolder: boolean) =>
    confirmTreeDelete(path, isFolder, async () => {
      const deleted = await (isFolder
        ? onDeleteFolder?.(path)
        : onDeleteNote?.(path));
      if (deleted && isFolder) onSelectedFolderChange?.(null);
      return deleted;
    });

  return {
    contextMenu,
    iconTarget,
    openContextMenu,
    confirmDelete,
    closeContextMenu: () => setContextMenu(null),
    closeIconPicker: () => setIconTarget(null),
    openIconPicker: (path: string, event: React.MouseEvent) =>
      setIconTarget({ path, x: event.clientX, y: event.clientY }),
  };
}
