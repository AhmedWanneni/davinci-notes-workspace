import { useState, useRef, type ChangeEvent, type ClipboardEvent } from "react";

export interface PromptAttachmentItem {
  id: string;
  kind: "file" | "skill" | "rule" | "note";
  name: string;
  badge: string;
  content: string;
}

function getFileBadge(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length > 1) {
    const ext = parts[parts.length - 1].trim().toUpperCase();
    if (ext && ext.length <= 6) return ext;
  }
  return "FILE";
}

export function usePromptAttachments(onAppendText?: (text: string) => void) {
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [attachedItems, setAttachedItems] = useState<PromptAttachmentItem[]>(
    [],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeImage = (idx: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const addAttachmentItem = (item: Omit<PromptAttachmentItem, "id"> & { id?: string }) => {
    const id = item.id || `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setAttachedItems((prev) => {
      if (prev.some((existing) => existing.name === item.name && existing.kind === item.kind)) {
        return prev;
      }
      return [...prev, { ...item, id }];
    });
  };

  const removeAttachmentItem = (id: string) => {
    setAttachedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearImages = () => {
    setAttachedImages([]);
    setAttachedItems([]);
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = (event) => {
          const url = event.target?.result as string;
          if (url) setAttachedImages((prev) => [...prev, url]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const url = ev.target?.result as string;
          if (url) setAttachedImages((prev) => [...prev, url]);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = (ev.target?.result as string) || "";
          addAttachmentItem({
            kind: "file",
            name: file.name,
            badge: getFileBadge(file.name),
            content: text,
          });
        };
        reader.readAsText(file);
      }
    }
    e.target.value = "";
    void onAppendText;
  };

  const handleTakeScreenshot = () => {
    if (navigator.clipboard?.read) {
      navigator.clipboard
        .read()
        .then((items) => {
          for (const item of items) {
            const imgType = item.types.find((t) => t.startsWith("image/"));
            if (imgType) {
              void item.getType(imgType).then((blob) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const url = ev.target?.result as string;
                  if (url) setAttachedImages((prev) => [...prev, url]);
                };
                reader.readAsDataURL(blob);
              });
            }
          }
        })
        .catch(() => {
          fileInputRef.current?.click();
        });
    } else {
      fileInputRef.current?.click();
    }
  };

  return {
    attachedImages,
    attachedItems,
    fileInputRef,
    removeImage,
    addAttachmentItem,
    removeAttachmentItem,
    clearImages,
    handlePaste,
    handleFileInput,
    handleTakeScreenshot,
  };
}
