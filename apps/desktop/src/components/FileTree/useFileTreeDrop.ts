import { type DragEvent, useCallback } from "react";

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
  const handleDragOver = useCallback((event: DragEvent) => {
    const hasInternalNote = event.dataTransfer.types.includes(
      "application/vnd.davinci.note",
    );
    const hasFiles = event.dataTransfer.types.includes("Files");
    if (!hasInternalNote && !hasFiles) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = hasInternalNote ? "move" : "copy";
  }, []);

  const handleDrop = useCallback(
    async (event: DragEvent, targetFolder: string) => {
      event.preventDefault();
      const notePath = event.dataTransfer.getData(
        "application/vnd.davinci.note",
      );
      if (notePath) {
        const currentFolder = notePath.includes("/")
          ? notePath.slice(0, notePath.lastIndexOf("/"))
          : "";
        if (currentFolder !== targetFolder) {
          const move = notePath.endsWith(".md") ? onMoveNote : onMoveFile;
          await move?.(notePath, targetFolder);
        }
        return;
      }

      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0 && onDropFiles) {
        await onDropFiles(targetFolder, files);
      }
    },
    [onDropFiles, onMoveFile, onMoveNote],
  );

  return { handleDragOver, handleDrop };
}
