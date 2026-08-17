import {
  useCallback,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import { sanitizeWebUrl } from "./linkCardUtils";
import {
  generatePastedMediaFilename,
  isMediaFile,
  isPdfFile,
} from "./mediaCardUtils";

export interface UseCanvasDropPasteOptions {
  allNotePaths: readonly string[];
  createFileCard: (
    filePath: string,
    position: { x: number; y: number },
    subpath?: string,
  ) => void;
  createLinkCard?: (
    url: string,
    position: { x: number; y: number },
  ) => void;
  screenToFlowPosition: (clientPosition: { x: number; y: number }) => {
    x: number;
    y: number;
  };
  onSaveMediaFile?: (fileName: string, data: Uint8Array) => Promise<string>;
}

export function useCanvasDropPaste({
  allNotePaths,
  createFileCard,
  createLinkCard,
  screenToFlowPosition,
  onSaveMediaFile,
}: UseCanvasDropPasteOptions) {

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const clientPos = { x: e.clientX, y: e.clientY };
      const flowPos = screenToFlowPosition(clientPos);

      // Handle internal file drag from FileTree
      const internalNote = e.dataTransfer.getData(
        "application/vnd.davinci.note",
      );
      if (internalNote) {
        createFileCard(internalNote, flowPos);
        return;
      }

      // Handle OS external file drop
      const files = Array.from(e.dataTransfer.files ?? []);
      if (files.length > 0 && onSaveMediaFile) {
        for (const file of files) {
          const isPdf =
            isPdfFile(file.name) || file.type === "application/pdf";
          if (
            isMediaFile(file.name) ||
            isPdf ||
            file.type.startsWith("image/") ||
            file.type.startsWith("video/")
          ) {
            try {
              const buffer = await file.arrayBuffer();
              const uint8 = new Uint8Array(buffer);
              const targetName = file.name.includes("/")
                ? file.name.split("/").pop()!
                : file.name;
              const savedPath = await onSaveMediaFile(
                `attachments/${targetName}`,
                uint8,
              );
              createFileCard(savedPath, flowPos);
            } catch (err) {
              console.error(
                isPdf ? "Failed to save dropped PDF file" : "Failed to save dropped media file",
                err,
              );
            }
          }
        }
        return;
      }

      // Fallback text drop
      const plainText = e.dataTransfer.getData("text/plain")?.trim();
      if (plainText) {
        const sanitizedUrl = sanitizeWebUrl(plainText);
        if (
          sanitizedUrl &&
          createLinkCard &&
          (plainText.startsWith("http://") ||
            plainText.startsWith("https://") ||
            plainText.includes("."))
        ) {
          createLinkCard(sanitizedUrl, flowPos);
          return;
        }
        if (!plainText.includes("\n")) {
          createFileCard(plainText, flowPos);
        }
      }
    },
    [createFileCard, createLinkCard, onSaveMediaFile, screenToFlowPosition],
  );

  const handlePaste = useCallback(
    async (e: ClipboardEvent<HTMLDivElement>) => {
      // 1. Check for pasted image data
      const items = Array.from(e.clipboardData.items ?? []);
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob && onSaveMediaFile) {
            e.preventDefault();
            try {
              const ext = blob.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
              const targetName = generatePastedMediaFilename(ext);
              const buffer = await blob.arrayBuffer();
              const uint8 = new Uint8Array(buffer);
              const savedPath = await onSaveMediaFile(targetName, uint8);
              const centerPos = screenToFlowPosition({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
              });
              createFileCard(savedPath, centerPos);
              return;
            } catch (err) {
              console.error("Failed to save pasted image", err);
            }
          }
        }
      }

      // 2. Check for wikilink paste [[Note]]
      const text = e.clipboardData.getData("text")?.trim();
      if (!text) return;
      const wikilinkMatch = text.match(/^\[\[([^\]]+)\]\]$/);
      if (wikilinkMatch) {
        e.preventDefault();
        const targetName = wikilinkMatch[1];
        const matched =
          allNotePaths.find((p) => {
            const stem =
              p.replace(/\.(md|canvas)$/i, "").split("/").pop() ?? p;
            return stem.toLowerCase() === targetName.toLowerCase();
          }) ?? `${targetName}.md`;
        createFileCard(
          matched,
          screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
          }),
        );
        return;
      }

      // 3. Check for URL paste
      const sanitized = sanitizeWebUrl(text);
      if (
        sanitized &&
        createLinkCard &&
        (text.startsWith("http://") ||
          text.startsWith("https://") ||
          text.includes("."))
      ) {
        e.preventDefault();
        const centerPos = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
        createLinkCard(sanitized, centerPos);
      }
    },
    [
      allNotePaths,
      createFileCard,
      createLinkCard,
      onSaveMediaFile,
      screenToFlowPosition,
    ],
  );

  return { handleDragOver, handleDrop, handlePaste };
}

