import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { SearchResult } from "@app/indexer";
import { QuickCaptureDestination } from "./QuickCaptureDestination";
import { QuickCaptureFooter } from "./QuickCaptureFooter";
import { QuickCaptureHeader, type QuickCaptureMode } from "./QuickCaptureHeader";
import { QuickCaptureReminder } from "./QuickCaptureReminder";
import { QuickSearchList } from "./QuickSearchList";
import { useCaptureKeybindings } from "./useCaptureKeybindings";
import { useCaptureTheme } from "./useCaptureTheme";
import { useQuickSearch } from "./useQuickSearch";
import { restoreCachedBuiltinTheme } from "../../themes";
import styles from "./QuickCapture.module.scss";
import { Input } from "@app/design-system";

export const MAX_CAPTURE_CHARS = 10_000;

export interface QuickCaptureProps {
  onSave?: (
    text: string,
    filename?: string,
    folder?: string,
  ) => Promise<void> | void;
  onDismiss?: () => Promise<void> | void;
  onOpenNote?: (path: string) => Promise<void> | void;
  initialMode?: QuickCaptureMode;
  searchFn?: (query: string) => Promise<SearchResult[]>;
}

const toErrorText = (err: unknown, fallback: string) =>
  typeof err === "string" ? err : err instanceof Error ? err.message : fallback;

export function QuickCapture(props: QuickCaptureProps) {
  const {
    onSave,
    onDismiss,
    onOpenNote,
    initialMode = "capture",
    searchFn,
  } = props;
  const [mode, setMode] = useState<QuickCaptureMode>(initialMode);
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("");
  const [folder, setFolder] = useState("");
  const [savedDestination, setSavedDestination] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useCaptureTheme();
  const search = useQuickSearch({ searchFn });
  const { query, setQuery, results, selectedIndex, setSelectedIndex } = search;

  useEffect(() => {
    const focusActive = () => {
      if (mode === "capture") textareaRef.current?.focus();
      else searchInputRef.current?.focus();
    };
    focusActive();

    let unlisten: (() => void) | undefined;
    void listen("davinci-capture-focus", () => {
      restoreCachedBuiltinTheme();
      focusActive();
    }).then((fn) => { unlisten = fn; }).catch(() => {});
    return () => { unlisten?.(); };
  }, [mode]);

  const handleDismiss = async () => {
    setErrorMessage(null);
    setSavedDestination(null);
    search.resetSearch();
    setMode("capture");
    if (onDismiss) await onDismiss();
    else void invoke("quick_capture_dismiss").catch(() => {});
  };

  const handleSave = async (
    content: string,
    overrideFilename?: string,
    overrideFolder?: string,
  ) => {
    const trimmed = content.trim();
    if (!trimmed) {
      await handleDismiss();
      return;
    }
    const clearInputs = () => { setText(""); setFilename(""); setFolder(""); };
    setErrorMessage(null);
    try {
      const fName = (overrideFilename ?? filename).trim() || undefined;
      const fDir = (overrideFolder ?? folder).trim() || undefined;
      if (onSave) {
        if (fName || fDir) await onSave(content, fName, fDir);
        else await onSave(content);
        clearInputs();
      } else {
        const res = await invoke<{ path: string; isAppend: boolean }>(
          "quick_capture_save",
          { text: content, filename: fName ?? null, folder: fDir ?? null },
        );
        setSavedDestination(res.path);
        setTimeout(() => {
          clearInputs();
          setSavedDestination(null);
          void invoke("quick_capture_dismiss").catch(() => {});
        }, 650);
      }
    } catch (err) {
      setErrorMessage(toErrorText(err, "Failed to save"));
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
      setErrorMessage(toErrorText(err, "Failed to open note"));
    }
  };

  const { handleCaptureKeyDown, handleSearchKeyDown } = useCaptureKeybindings({
    setMode,
    text,
    onSave: (c) => void handleSave(c),
    onDismiss: () => void handleDismiss(),
    onOpenNote: (p) => void handleOpenNote(p),
    nameInputRef,
    search,
  });

  return (
    <div
      className={styles["quick-capture-container"]}
      onMouseDown={() => { void invoke("quick_capture_bring_to_front").catch(() => {}); }}
    >
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
        <>
          <textarea
            ref={textareaRef}
            className={styles["quick-capture-textarea"]}
            value={text}
            maxLength={MAX_CAPTURE_CHARS}
            placeholder="Type a thought... (Tab for note name, ⌘S to save, Esc to quit)"
            onChange={(e) => {
              setText(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            onKeyDown={handleCaptureKeyDown}
            aria-label="Quick capture text"
          />
          <QuickCaptureDestination
            filename={filename}
            onFilenameChange={(name) => {
              setFilename(name);
              if (errorMessage) setErrorMessage(null);
            }}
            folder={folder}
            onFolderChange={(f) => {
              setFolder(f);
              if (errorMessage) setErrorMessage(null);
            }}
            onSave={() => void handleSave(text)}
            onDismiss={() => void handleDismiss()}
            nameInputRef={nameInputRef}
          />
        </>
      ) : mode === "reminder" ? (
        <QuickCaptureReminder
          onSaveReminder={(reminderText, fName, fDir) =>
            handleSave(reminderText, fName, fDir)
          }
          onDismiss={() => void handleDismiss()}
          folder={folder}
          onFolderChange={setFolder}
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

      {savedDestination && (
        <div className={styles["quick-capture-success"]} role="status">
          ✓ Saved to {savedDestination}
        </div>
      )}

      {errorMessage && (
        <div className={styles["quick-capture-error"]} role="alert">
          {errorMessage}
        </div>
      )}

      {mode !== "reminder" && (
        <QuickCaptureFooter
          mode={mode}
          canSave={text.trim().length > 0}
          onSave={() => void handleSave(text)}
          onDismiss={() => void handleDismiss()}
        />
      )}
    </div>
  );
}
