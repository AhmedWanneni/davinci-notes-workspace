import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { SearchResult } from "@app/indexer";
import { QuickCaptureFooter } from "./QuickCaptureFooter";
import { QuickCaptureHeader } from "./QuickCaptureHeader";
import { QuickSearchList } from "./QuickSearchList";
import { useCaptureTheme } from "./useCaptureTheme";
import { useQuickSearch } from "./useQuickSearch";
import { restoreCachedBuiltinTheme } from "../../themes";
import styles from "./QuickCapture.module.scss";
import { Input } from "@app/design-system";

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

  useCaptureTheme();

  const search = useQuickSearch({ searchFn });
  const { query, setQuery, results, selectedIndex, setSelectedIndex } = search;

  useEffect(() => {
    if (mode === "capture") textareaRef.current?.focus();
    else searchInputRef.current?.focus();

    let unlisten: (() => void) | undefined;
    void listen("davinci-capture-focus", () => {
      restoreCachedBuiltinTheme();
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
    const isSave =
      (e.key === "s" && (e.ctrlKey || e.metaKey)) ||
      (e.key === "Enter" && (e.ctrlKey || e.metaKey));
    const isQuit =
      e.key === "Escape" ||
      ((e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "q" || e.key.toLowerCase() === "w"));

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setMode("search");
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      setMode("search");
    } else if (isQuit) {
      e.preventDefault();
      void handleDismiss();
    } else if (isSave) {
      e.preventDefault();
      void handleSave(text);
    }
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const isQuit =
      (e.ctrlKey || e.metaKey) &&
      (e.key.toLowerCase() === "q" || e.key.toLowerCase() === "w");

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
    } else if (isQuit) {
      e.preventDefault();
      void handleDismiss();
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

  return (
    <div className={styles["quick-capture-container"]}>
      <QuickCaptureHeader
        mode={mode}
        onModeChange={setMode}
        charCount={text.length}
        maxChars={MAX_CAPTURE_CHARS}
        selectedIndex={selectedIndex}
        resultCount={results.length}
        onDismiss={() => void handleDismiss()}
      />

      {mode === "capture" ? (
        <textarea
          ref={textareaRef}
          className={styles["quick-capture-textarea"]}
          value={text}
          maxLength={MAX_CAPTURE_CHARS}
          placeholder="Type a thought... (Tab to search, ⌘S to save, Esc to quit)"
          onChange={(e) => {
            setText(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          onKeyDown={handleCaptureKeyDown}
          aria-label="Quick capture text"
        />
      ) : (
        <div className={styles["quick-search-body"]}>
          <Input
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

      <QuickCaptureFooter
        mode={mode}
        canSave={text.trim().length > 0}
        onSave={() => void handleSave(text)}
        onDismiss={() => void handleDismiss()}
      />
    </div>
  );
}
