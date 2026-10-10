import { useEffect, useState } from "react";
import { getParentFolder } from "./getDropEffect";

interface UseTreeExpandedFoldersOptions {
  activePath: string | null;
  pendingRenameFolder?: string | null;
  pendingRenameNote?: string | null;
  onSelectedFolderChange?: (folderPath: string | null) => void;
  onStartRename?: (path: string, kind: "note" | "folder") => void;
  onPendingRenameHandled?: () => void;
  onPendingRenameNoteHandled?: () => void;
}

export function useTreeExpandedFolders({
  activePath,
  pendingRenameFolder,
  pendingRenameNote,
  onSelectedFolderChange,
  onStartRename,
  onPendingRenameHandled,
  onPendingRenameNoteHandled,
}: UseTreeExpandedFoldersOptions) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (!pendingRenameFolder) return;
    const parent = getParentFolder(pendingRenameFolder);
    if (parent) setExpandedFolders((prev) => new Set(prev).add(parent));
    onStartRename?.(pendingRenameFolder, "folder");
    onPendingRenameHandled?.();
  }, [pendingRenameFolder, onPendingRenameHandled, onStartRename]);

  useEffect(() => {
    if (!pendingRenameNote) return;
    const parent = getParentFolder(pendingRenameNote);
    if (parent) setExpandedFolders((prev) => new Set(prev).add(parent));
    onStartRename?.(pendingRenameNote, "note");
    onPendingRenameNoteHandled?.();
  }, [pendingRenameNote, onPendingRenameNoteHandled, onStartRename]);

  useEffect(() => {
    if (!activePath) return;
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

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
    onSelectedFolderChange?.(folderPath);
  };

  const expandFolder = (folderPath: string) => {
    setExpandedFolders((prev) => new Set(prev).add(folderPath));
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
  };

  const expandAll = (folderPaths: string[]) => {
    setExpandedFolders(new Set(folderPaths));
  };

  return {
    expandedFolders,
    toggleFolder,
    expandFolder,
    collapseAll,
    expandAll,
  };
}
