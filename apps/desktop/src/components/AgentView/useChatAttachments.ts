import { useState, useRef, useCallback, type ClipboardEvent, type DragEvent } from "react";
import { fileToChatAttachment } from "./imageAttachmentUtils";
import type { ChatAttachmentItem } from "./agentTypes";

export function useChatAttachments() {
  const [attachments, setAttachments] = useState<ChatAttachmentItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    for (const file of list) {
      const att = await fileToChatAttachment(file);
      setAttachments((prev) => [...prev, att]);
    }
  }, []);

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const hasImages = Array.from(e.clipboardData.files).some((f) =>
          f.type.startsWith("image/"),
        );
        if (hasImages) {
          e.preventDefault();
          void addFiles(e.clipboardData.files);
        }
      }
    },
    [addFiles],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        void addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return {
    attachments,
    setAttachments,
    fileInputRef,
    addFiles,
    handlePaste,
    handleDrop,
    handleDragOver,
    removeAttachment: (id: string) =>
      setAttachments((prev) => prev.filter((a) => a.id !== id)),
  };
}
