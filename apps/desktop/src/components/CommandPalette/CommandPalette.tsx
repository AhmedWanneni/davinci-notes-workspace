import React, { useState, useEffect, useMemo, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import fuzzysort from "fuzzysort";
import { FileText } from "@phosphor-icons/react";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import styles from "./CommandPalette.module.scss";

interface CommandPaletteProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectNote: (path: string) => void;
}

export function CommandPalette({
  isOpen,
  onOpenChange,
  onSelectNote,
}: CommandPaletteProps) {
  const { allNotePaths, openNotes } = useWorkspaceStore();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      // Small timeout to allow dialog to mount before focusing
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const preparedTargets = useMemo(() => {
    return allNotePaths.map((path) => {
      const title = path.replace(/\.md$/i, "").split(/[/\\]/).pop() ?? path;
      // Recency boost: +1 for open notes, +2 for active (handled differently, but openNotes gives basic recency proxy)
      const recencyScore = openNotes.includes(path) ? 1000 : 0;
      return { path, title, recencyScore };
    });
  }, [allNotePaths, openNotes]);

  const results = useMemo(() => {
    if (!query) {
      // Return recent notes or all notes if empty
      const sorted = [...preparedTargets].sort(
        (a, b) => b.recencyScore - a.recencyScore,
      );
      return sorted.slice(0, 20).map((t) => ({
        obj: t,
        highlightedTitle: t.title,
      }));
    }

    const searchResults = fuzzysort.go(query, preparedTargets, {
      key: "title",
      limit: 20,
    });

    return searchResults.map((result) => ({
      obj: result.obj,
      highlightedTitle:
        result.highlight(`<mark class="${styles.highlight}">`, `</mark>`) ||
        result.obj.title,
    }));
  }, [query, preparedTargets]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length === 0) return;
      setSelectedIndex((prev) => (prev + 1) % results.length);
      scrollSelectedIntoView(selectedIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      scrollSelectedIntoView(selectedIndex - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0) {
        const selected = results[selectedIndex];
        if (selected) {
          onSelectNote(selected.obj.path);
          onOpenChange(false);
        }
      } else if (query.trim() !== "") {
        // Create new note
        onSelectNote(query.trim());
        onOpenChange(false);
      }
    }
  };

  const scrollSelectedIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.children;
    const targetIndex = (index + results.length) % results.length;
    const item = items[targetIndex] as HTMLElement;
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={"dialog-overlay"} />
        <DialogPrimitive.Content className={"dialog-content"}>
          <div className={"input-wrapper"}>
            <input
              ref={inputRef}
              className={"input"}
              placeholder="Type to search or create..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <ul
            className={styles.resultsList}
            ref={listRef}
            role="listbox"
            aria-label="Quick switcher results"
          >
            {results.map((result, index) => {
              const isSelected = index === selectedIndex;
              return (
                <li
                  key={result.obj.path}
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.resultItem} ${
                    isSelected ? styles.isSelected : ""
                  }`}
                  onClick={() => {
                    onSelectNote(result.obj.path);
                    onOpenChange(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <FileText size={18} className={"icon"} weight="regular" />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: result.highlightedTitle,
                    }}
                  />
                </li>
              );
            })}
            {results.length === 0 && (
              <li className={styles.emptyState}>
                No notes found. Press Enter to create "{query}".
              </li>
            )}
          </ul>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
