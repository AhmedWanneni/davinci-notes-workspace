import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { SearchResult } from "@app/indexer";
import { QuickCaptureHints } from "./QuickCaptureHints";
import { QuickSearchList } from "./QuickSearchList";
import { useQuickSearch } from "./useQuickSearch";
import styles from "./QuickCapture.module.scss";

export const MAX_CAPTURE_CHARS = 10_000;

export interface QuickCaptureProps {
  onSave?: (text: string) => Promise<void> | void;
  onDismiss?: () => Promise<void> | void;
  onOpenNote?: (path: string) => Promise<void> | void;
  initialMode?: "capture" | "search";
  searchFn?: (query: string) => Promise<SearchResult[]>;
}

export function QuickCapture(props: QuickCaptureProps) {
  const {
    onSave,
    onDismiss,
    onOpenNote,
    initialMode = "capture",
    searchFn,
  } = props;
  const [mode, setMode] = useState<"capture" | "search">(initialMode);
  const [text, setText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const search = useQuickSearch({ searchFn });
  const { query, setQuery, results, selectedIndex, setSelectedIndex } = search;

  useEffect(() => {
    if (mode === "capture") textareaRef.current?.focus();
    else searchInputRef.current?.focus();

    let unlisten: (() => void) | undefined;
    void listen("davinci-capture-focus", () => {
      if (mode === "capture") textareaRef.current?.focus();
      else searchInputRef.current?.focus();
    })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {});

    return () => {
      unlisten?.();
    };
  }, [mode]);

  const handleDismiss = async () => {
    setErrorMessage(null);
    search.resetSearch();
    setMode("capture");
    if (onDismiss) {
      await onDismiss();
      return;
    }
    try {
      await invoke("quick_capture_dismiss");
    } catch {
      // Ignored outside Tauri
    }
  };

  const handleSave = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      await handleDismiss();
      return;
    }
    setErrorMessage(null);
    try {
      if (onSave) await onSave(content);
      else await invoke("quick_capture_save", { text: content });
      setText("");
    } catch (err) {
      setErrorMessage(
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Failed to save",
      );
    }
  };

  const handleOpenNote = async (path: string) => {
    setErrorMessage(null);
    try {
      if (onOpenNote) await onOpenNote(path);
      else await invoke("open_note_from_capture", { path });
      search.resetSearch();
      setMode("capture");
    } catch (err) {
      setErrorMessage(
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Failed to open note",
      );
    }
  };

  const handleCaptureKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setMode("search");
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      setMode("search");
    } else if (e.key === "Escape") {
      e.preventDefault();
      void handleDismiss();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSave(text);
    }
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setMode("capture");
    } else if (e.key === "Tab") {
      e.preventDefault();
      setMode("capture");
    } else if (e.key === "Escape") {
      e.preventDefault();
      search.resetSearch();
      setMode("capture");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      search.selectNext();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      search.selectPrevious();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) void handleOpenNote(selected.path);
    }
  };

  const charCount = text.length;
  const isNearLimit = charCount > MAX_CAPTURE_CHARS * 0.9;

  return (
    <div className={styles["quick-capture-container"]}>
      <div className={styles["quick-capture-header"]}>
        <div className={styles["quick-capture-tabs"]} role="tablist">
          <button
            role="tab"
            aria-selected={mode === "capture"}
            className={`${styles["quick-capture-tab-btn"]} ${mode === "capture" ? styles["is-active"] : ""}`}
            onClick={() => setMode("capture")}
          >
            Capture
          </button>
          <button
            role="tab"
            aria-selected={mode === "search"}
            className={`${styles["quick-capture-tab-btn"]} ${mode === "search" ? styles["is-active"] : ""}`}
            onClick={() => setMode("search")}
          >
            Search
          </button>
        </div>
        {mode === "capture" ? (
          <span
            className={`${styles["quick-capture-counter"]} ${isNearLimit ? styles["quick-capture-counter-warning"] : ""}`}
          >
            {charCount} / {MAX_CAPTURE_CHARS}
          </span>
        ) : (
          <span className={styles["quick-capture-counter"]}>
            {results.length > 0
              ? `${selectedIndex + 1} of ${results.length}`
              : ""}
          </span>
        )}
      </div>

      {mode === "capture" ? (
        <textarea
          ref={textareaRef}
          className={styles["quick-capture-textarea"]}
          value={text}
          maxLength={MAX_CAPTURE_CHARS}
          placeholder="Type a thought... (Tab to search, Enter to save, Esc to dismiss)"
          onChange={(e) => {
            setText(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          onKeyDown={handleCaptureKeyDown}
          aria-label="Quick capture text"
        />
      ) : (
        <div className={styles["quick-search-body"]}>
          <input
            ref={searchInputRef}
            className={styles["quick-search-input"]}
            value={query}
            placeholder="Search notes by title or content... (↑↓ to move, Enter to open, Esc back)"
            onChange={(e) => {
              setQuery(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            onKeyDown={handleSearchKeyDown}
            aria-label="Search notes"
          />
          <QuickSearchList
            results={results}
            selectedIndex={selectedIndex}
            isLoading={search.isLoading}
            isError={search.isError}
            query={query}
            onSelect={(path) => void handleOpenNote(path)}
            onHoverIndex={setSelectedIndex}
          />
        </div>
      )}

      {errorMessage && (
        <div className={styles["quick-capture-error"]} role="alert">
          {errorMessage}
        </div>
      )}

      <div className={styles["quick-capture-footer"]}>
        <QuickCaptureHints mode={mode} />
      </div>
    </div>
  );
}
