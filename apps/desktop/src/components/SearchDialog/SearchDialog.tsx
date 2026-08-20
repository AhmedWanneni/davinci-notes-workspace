import React, { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { FileText, MagnifyingGlass } from "@phosphor-icons/react";
import type { SearchResult } from "@app/indexer";

export interface SearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string) => Promise<SearchResult[]>;
  onSelectNote: (path: string) => void;
  initialQuery?: string;
}

export function SearchDialog({
  isOpen,
  onOpenChange,
  onSearch,
  onSelectNote,
  initialQuery = "",
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery(initialQuery);
    setResults([]);
    setSelectedIndex(0);
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [initialQuery, isOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      void onSearch(query).then((nextResults) => {
        setResults(nextResults);
        setSelectedIndex(0);
      });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [onSearch, query]);

  const openSelected = () => {
    const selected = results[selectedIndex];
    if (!selected) return;
    onSelectNote(selected.path);
    onOpenChange(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % Math.max(results.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex(
        (index) => (index - 1 + results.length) % Math.max(results.length, 1),
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      openSelected();
    }
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="search-dialog__overlay" />
        <DialogPrimitive.Content className="search-dialog__dialog">
          <div className="search-dialog__input-wrapper">
            <MagnifyingGlass size={18} aria-hidden="true" />
            <input
              ref={inputRef}
              className="search-dialog__input"
              value={query}
              placeholder="Search notes, or use tag:..."
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Search notes"
            />
          </div>
          <ul className="search-dialog__list" role="listbox" aria-label="Search results">
            {results.map((result, index) => (
              <li
                key={result.path}
                className="search-dialog__item"
                data-selected={index === selectedIndex || undefined}
                role="option"
                aria-selected={index === selectedIndex}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  onSelectNote(result.path);
                  onOpenChange(false);
                }}
              >
                <FileText size={18} aria-hidden="true" />
                <span className="search-dialog__result-copy">
                  <span className="search-dialog__title">{result.title}</span>
                  <span className="search-dialog__path">{result.path}</span>
                  {result.snippet ? (
                    <span
                      className="search-dialog__snippet"
                      dangerouslySetInnerHTML={{ __html: result.snippet }}
                    />
                  ) : (
                    <span className="search-dialog__snippet">Tag match</span>
                  )}
                </span>
              </li>
            ))}
            {query.trim() && results.length === 0 && (
              <li className="search-dialog__empty">No matching notes.</li>
            )}
          </ul>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
