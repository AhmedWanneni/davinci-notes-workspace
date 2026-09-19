import { type DragEvent, useCallback, useEffect, useState } from "react";
import {
  getActiveDraggedNode,
  getDropEffect,
  getParentFolder,
  isHiddenOrSystemPath,
  setActiveDraggedNode,
} from "./getDropEffect";

interface UseFileTreeDropOptions {
  onMoveNote?: (path: string, targetFolder: string) => Promise<boolean>;
  onMoveFile?: (path: string, targetFolder: string) => Promise<boolean>;
  onDropFiles?: (targetFolder: string, files: readonly File[]) => Promise<void>;
}

export function useFileTreeDrop({
  onMoveNote,
  onMoveFile,
  onDropFiles,
}: UseFileTreeDropOptions) {
  const [draggedPath, setDraggedPath] = useState<string | null>(null);

  const handleDragStart = useCallback((path: string) => {
    setDraggedPath(path);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedPath(null);
    setActiveDraggedNode(null);
  }, []);

  useEffect(() => {
    const handleWindowDragEnd = () => {
      setDraggedPath(null);
      setActiveDraggedNode(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDraggedPath(null);
        setActiveDraggedNode(null);
      }
    };
    window.addEventListener("dragend", handleWindowDragEnd);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("dragend", handleWindowDragEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  const evaluateDropEffect = useCallback(
    (event: DragEvent, targetPath: string = "", isFolder: boolean = true) => {
      const hasInternalNote = event.dataTransfer.types.includes(
        "application/vnd.davinci.note",
      );
      const hasFiles = event.dataTransfer.types.includes("Files");

      if (!hasInternalNote && !hasFiles) {
        return;
      }

      event.preventDefault();

      if (hasInternalNote) {
        const dragged = getActiveDraggedNode();
        const effect = getDropEffect(dragged, { path: targetPath, isFolder });
        event.dataTransfer.dropEffect = effect;
      } else if (hasFiles) {
        const resolvedFolder = isFolder
          ? targetPath
          : getParentFolder(targetPath);
        event.dataTransfer.dropEffect = isHiddenOrSystemPath(resolvedFolder)
          ? "none"
          : "copy";
      }
    },
    [],
  );

  const handleDragEnter = useCallback(
    (event: DragEvent, targetPath: string = "", isFolder: boolean = true) => {
      evaluateDropEffect(event, targetPath, isFolder);
    },
    [evaluateDropEffect],
  );

  const handleDragOver = useCallback(
    (event: DragEvent, targetPath: string = "", isFolder: boolean = true) => {
      evaluateDropEffect(event, targetPath, isFolder);
    },
    [evaluateDropEffect],
  );

  const handleDrop = useCallback(
    async (
      event: DragEvent,
      targetPath: string = "",
      isFolder: boolean = true,
    ) => {
      event.preventDefault();
      const dragged = getActiveDraggedNode();
      const effect = getDropEffect(dragged, { path: targetPath, isFolder });
      const targetFolder = isFolder ? targetPath : getParentFolder(targetPath);

      setActiveDraggedNode(null);
      setDraggedPath(null);

      const notePath =
        dragged?.path ||
        event.dataTransfer.getData("application/vnd.davinci.note");

      if (notePath) {
        if (effect === "none") {
          return;
        }
        const currentFolder = getParentFolder(notePath);
        if (currentFolder !== targetFolder) {
          const move = notePath.endsWith(".md") ? onMoveNote : onMoveFile;
          await move?.(notePath, targetFolder);
        }
        return;
      }

      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0 && onDropFiles) {
        if (isHiddenOrSystemPath(targetFolder)) {
          return;
        }
        await onDropFiles(targetFolder, files);
      }
    },
    [onDropFiles, onMoveFile, onMoveNote],
  );

  return {
    draggedPath,
    handleDragStart,
    handleDragEnd,
    handleDragEnter,
    handleDragOver,
    handleDrop,
  };
}
