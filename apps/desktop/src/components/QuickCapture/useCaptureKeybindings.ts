import type { KeyboardEvent, RefObject } from "react";
import type { SearchResult } from "@app/indexer";
import type { QuickCaptureMode } from "./QuickCaptureHeader";

export interface UseCaptureKeybindingsOptions {
  setMode: (mode: QuickCaptureMode) => void;
  text: string;
  onSave: (content: string) => void;
  onDismiss: () => void;
  onOpenNote: (path: string) => void;
  nameInputRef: RefObject<HTMLInputElement | null>;
  search: {
    results: SearchResult[];
    selectedIndex: number;
    selectNext: () => void;
    selectPrevious: () => void;
    resetSearch: () => void;
  };
}

export function useCaptureKeybindings({
  setMode,
  text,
  onSave,
  onDismiss,
  onOpenNote,
  nameInputRef,
  search,
}: UseCaptureKeybindingsOptions) {
  const handleCaptureKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const isMod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    if (isMod && key === "k") {
      e.preventDefault();
      setMode("search");
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      nameInputRef.current?.focus();
    } else if (e.key === "Escape" || (isMod && (key === "q" || key === "w"))) {
      e.preventDefault();
      onDismiss();
    } else if ((isMod && key === "s") || (isMod && e.key === "Enter")) {
      e.preventDefault();
      onSave(text);
    }
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const isMod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    if (isMod && key === "k") {
      e.preventDefault();
      setMode("capture");
    } else if (e.key === "Escape") {
      e.preventDefault();
      search.resetSearch();
      setMode("capture");
    } else if (isMod && (key === "q" || key === "w")) {
      e.preventDefault();
      onDismiss();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      search.selectNext();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      search.selectPrevious();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = search.results[search.selectedIndex];
      if (selected) onOpenNote(selected.path);
    }
  };

  return { handleCaptureKeyDown, handleSearchKeyDown };
}
