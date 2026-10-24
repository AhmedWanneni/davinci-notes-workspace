import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@app/design-system";
import { X } from "@phosphor-icons/react";
import type { SearchResult } from "@app/indexer";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

export interface SemanticSearchResult {
  path: string;
  heading: string | null;
  startLine: number;
  endLine: number;
  score: number;
}

export interface SearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string) => Promise<SearchResult[]>;
  onSelectNote: (path: string) => void;
  initialQuery?: string;
  semanticSearch?: (query: string) => Promise<SemanticSearchResult[]>;
  semanticSearchEnabled?: boolean;
  openNotes?: readonly string[];
}

function getOpenedFileResults(paths: readonly string[]): SearchResult[] {
  return paths.slice(0, 5).map((path) => ({
    path,
    title: path.replace(/\.(md|canvas)$/i, "").split(/[/\\]/).pop() ?? path,
    mtime: 0,
    score: 0,
  }));
}

export function SearchDialog({
  isOpen,
  onOpenChange,
  onSearch,
  onSelectNote,
  initialQuery = "",
  semanticSearch,
  semanticSearchEnabled = false,
  openNotes,
}: SearchDialogProps) {
  const storeOpenNotes = useWorkspaceStore((state) => state.openNotes);
  const effectiveOpenNotes = openNotes ?? storeOpenNotes;
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"exact" | "semantic">("exact");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [semanticResults, setSemanticResults] = useState<
    SemanticSearchResult[]
  >([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery(initialQuery);
    setResults(!initialQuery.trim() ? getOpenedFileResults(effectiveOpenNotes) : []);
    setSemanticResults([]);
    setMode("exact");
    setSelectedIndex(0);
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [effectiveOpenNotes, initialQuery, isOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!query.trim()) {
        setResults(
          mode === "exact" ? getOpenedFileResults(effectiveOpenNotes) : [],
        );
        setSemanticResults([]);
        return;
      }
      if (mode === "semantic" && query.trim().length < 3) {
        setResults([]);
        setSemanticResults([]);
        return;
      }
      if (mode === "semantic" && semanticSearch) {
        void semanticSearch(query.trim()).then((res) => {
          setSemanticResults(res);
          setResults([]);
          setSelectedIndex(0);
        });
        return;
      }
      void onSearch(query.trim()).then((res) => {
        setResults(res);
        setSemanticResults([]);
        setSelectedIndex(0);
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [effectiveOpenNotes, mode, onSearch, query, semanticSearch]);

  const openSelected = () => {
    if (mode === "exact") {
      const selected = results[selectedIndex];
      if (selected) {
        onSelectNote(selected.path);
        onOpenChange(false);
      }
      return;
    }
    const selectedSemantic = semanticResults[selectedIndex];
    if (selectedSemantic) {
      onSelectNote(selectedSemantic.path);
      onOpenChange(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const total = mode === "exact" ? results.length : semanticResults.length;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % Math.max(total, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => (index - 1 + total) % Math.max(total, 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      openSelected();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="search-dialog__dialog" showCloseButton={false}>
        <div className="search-dialog__input-wrapper">
          <input
            ref={inputRef}
            className="search-dialog__input"
            value={query}
            placeholder="Select a command..."
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search notes"
          />
          <button
            type="button"
            className="search-dialog__close"
            onClick={() => onOpenChange(false)}
            aria-label="Close search"
          >
            <X size={10} weight="bold" />
          </button>
        </div>
        {semanticSearchEnabled && semanticSearch && (
          <div
            className="search-dialog__mode-switch"
            role="group"
            aria-label="Search mode"
          >
            <button
              type="button"
              aria-pressed={mode === "exact"}
              onClick={() => setMode("exact")}
            >
              Exact
            </button>
            <button
              type="button"
              aria-pressed={mode === "semantic"}
              onClick={() => setMode("semantic")}
            >
              Semantic
            </button>
          </div>
        )}
        <ul
          className="search-dialog__list"
          role="listbox"
          aria-label="Search results"
        >
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
              <span className="search-dialog__result-copy">
                <div className="search-dialog__row-header">
                  <span className="search-dialog__title">{result.title}</span>
                  {result.path !== result.title && (
                    <span className="search-dialog__path">{result.path}</span>
                  )}
                </div>
                {result.snippet && (
                  <span
                    className="search-dialog__snippet"
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />
                )}
              </span>
            </li>
          ))}
          {semanticResults.map((result, index) => (
            <li
              key={`${result.path}:${result.startLine}`}
              className="search-dialog__item"
              data-selected={index === selectedIndex || undefined}
              role="option"
              aria-selected={index === selectedIndex}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={openSelected}
            >
              <span className="search-dialog__result-copy">
                <div className="search-dialog__row-header">
                  <span className="search-dialog__title">{result.path}</span>
                  <span className="search-dialog__path">
                    Semantic match{result.heading ? ` - ${result.heading}` : ""}
                  </span>
                </div>
                <span className="search-dialog__snippet">
                  Lines {result.startLine}-{result.endLine}
                </span>
              </span>
            </li>
          ))}
          {query.trim() &&
            results.length === 0 &&
            semanticResults.length === 0 && (
              <li className="search-dialog__empty">No matching notes.</li>
            )}
        </ul>
        <div className="search-dialog__footer">
          <span>↑↓ to navigate</span>
          <span>↵ to use</span>
          <span>esc to dismiss</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
