import { useEffect } from "react";
import type { BookmarkItem } from "../../bookmarks/bookmarkTypes";

export interface UseBookmarkKeyboardNavOptions {
  items: BookmarkItem[];
  selectedIndex: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  onOpen: (path: string, newTab: boolean) => void;
  onRemove: (path: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export function useBookmarkKeyboardNav({
  items,
  selectedIndex,
  setSelectedIndex,
  onOpen,
  onRemove,
  searchInputRef,
}: UseBookmarkKeyboardNavOptions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is typing in an input / textarea (other than listening for '/' when not focused)
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (isInput && target === searchInputRef.current) {
        if (e.key === "Escape") {
          e.preventDefault();
          searchInputRef.current?.blur();
        } else if (e.key === "ArrowDown" && items.length > 0) {
          e.preventDefault();
          setSelectedIndex(0);
          searchInputRef.current?.blur();
        }
        return;
      }

      if (isInput) return;

      if (items.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        const item = items[selectedIndex];
        if (item) {
          e.preventDefault();
          const isNewTab = e.metaKey || e.ctrlKey;
          onOpen(item.path, isNewTab);
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const item = items[selectedIndex];
        if (item) {
          e.preventDefault();
          onRemove(item.path);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, selectedIndex, setSelectedIndex, onOpen, onRemove, searchInputRef]);
}
