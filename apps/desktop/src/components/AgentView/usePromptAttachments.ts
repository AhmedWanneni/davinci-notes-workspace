import { useState, useRef, type ChangeEvent, type ClipboardEvent } from "react";

export function usePromptAttachments(onAppendText?: (text: string) => void) {
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeImage = (idx: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearImages = () => setAttachedImages([]);

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
      } else if (onAppendText) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result as string;
          if (text) onAppendText(text);
        };
        reader.readAsText(file);
      }
    }
    e.target.value = "";
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
    fileInputRef,
    removeImage,
    clearImages,
    handlePaste,
    handleFileInput,
    handleTakeScreenshot,
  };
}
