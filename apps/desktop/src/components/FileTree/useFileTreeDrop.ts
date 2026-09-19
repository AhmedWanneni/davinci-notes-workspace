import {
  type DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
  onExpandFolder?: (folderPath: string) => void;
}

export function useFileTreeDrop({
  onMoveNote,
  onMoveFile,
  onDropFiles,
  onExpandFolder,
}: UseFileTreeDropOptions) {
  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const [dropTargetFolder, setDropTargetFolder] = useState<string | null>(null);
  const expandTimerRef = useRef<number | null>(null);

  const clearExpandTimer = useCallback(() => {
    if (expandTimerRef.current !== null) {
      window.clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
  }, []);

  const handleDragStart = useCallback((path: string) => {
    setDraggedPath(path);
  }, []);

  const handleDragEnd = useCallback(() => {
    clearExpandTimer();
    setDraggedPath(null);
    setDropTargetFolder(null);
    setActiveDraggedNode(null);
  }, [clearExpandTimer]);

  useEffect(() => {
    const handleWindowDragEnd = () => {
      clearExpandTimer();
      setDraggedPath(null);
      setDropTargetFolder(null);
      setActiveDraggedNode(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearExpandTimer();
        setDraggedPath(null);
        setDropTargetFolder(null);
        setActiveDraggedNode(null);
      }
    };
    window.addEventListener("dragend", handleWindowDragEnd);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("dragend", handleWindowDragEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [clearExpandTimer]);

  const resolveTargetFolder = useCallback(
    (event: DragEvent): { targetFolder: string; isFolder: boolean } => {
      const currentTarget = event.currentTarget as HTMLElement;
      const targetEl = event.target as HTMLElement | null;
      const row = targetEl?.closest?.(".file-tree__row") as HTMLElement | null;

      if (!row || row === currentTarget) {
        return { targetFolder: "", isFolder: true };
      }

      const rowPath = row.getAttribute("data-path") || "";
      const rowType = row.getAttribute("data-type") as "file" | "folder";
      const isFolder = rowType === "folder";
      const targetFolder = isFolder ? rowPath : getParentFolder(rowPath);

      return { targetFolder, isFolder };
    },
    [],
  );

  const evaluateDropEffect = useCallback(
    (event: DragEvent) => {
      const hasInternalNote = event.dataTransfer.types.includes(
        "application/vnd.davinci.note",
      );
      const hasFiles = event.dataTransfer.types.includes("Files");

      if (!hasInternalNote && !hasFiles) {
        return;
      }

      event.preventDefault();
      const { targetFolder, isFolder } = resolveTargetFolder(event);

      let effect: "move" | "copy" | "none" = "none";
      if (hasInternalNote) {
        const dragged = getActiveDraggedNode();
        effect = getDropEffect(dragged, { path: targetFolder, isFolder: true });
      } else if (hasFiles) {
        effect = isHiddenOrSystemPath(targetFolder) ? "none" : "copy";
      }

      event.dataTransfer.dropEffect = effect;

      const nextTarget = effect !== "none" ? targetFolder : null;
      setDropTargetFolder((prev) => {
        if (prev === nextTarget) {
          return prev;
        }

        clearExpandTimer();
        if (nextTarget && isFolder && onExpandFolder) {
          expandTimerRef.current = window.setTimeout(() => {
            onExpandFolder(nextTarget);
            expandTimerRef.current = null;
          }, 600);
        }
        return nextTarget;
      });
    },
    [clearExpandTimer, onExpandFolder, resolveTargetFolder],
  );

  const handleDragEnter = useCallback(
    (event: DragEvent) => {
      evaluateDropEffect(event);
    },
    [evaluateDropEffect],
  );

  const handleDragOver = useCallback(
    (event: DragEvent) => {
      evaluateDropEffect(event);
    },
    [evaluateDropEffect],
  );

  const handleDragLeave = useCallback(
    (event: DragEvent) => {
      const currentTarget = event.currentTarget as HTMLElement;
      const relatedTarget = event.relatedTarget as Node | null;
      if (!currentTarget.contains(relatedTarget)) {
        clearExpandTimer();
        setDropTargetFolder(null);
      }
    },
    [clearExpandTimer],
  );

  const handleDrop = useCallback(
    async (event: DragEvent) => {
      event.preventDefault();
      clearExpandTimer();
      const { targetFolder } = resolveTargetFolder(event);

      const dragged = getActiveDraggedNode();
      const effect = getDropEffect(dragged, {
        path: targetFolder,
        isFolder: true,
      });

      setActiveDraggedNode(null);
      setDraggedPath(null);
      setDropTargetFolder(null);

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
    [
      clearExpandTimer,
      onDropFiles,
      onMoveFile,
      onMoveNote,
      resolveTargetFolder,
    ],
  );

  return {
    draggedPath,
    dropTargetFolder,
    handleDragStart,
    handleDragEnd,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
