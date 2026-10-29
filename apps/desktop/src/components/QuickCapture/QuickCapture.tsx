import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { SearchResult } from "@app/indexer";
import { QuickCaptureDestination } from "./QuickCaptureDestination";
import { QuickCaptureFooter } from "./QuickCaptureFooter";
import { QuickCaptureHeader, type QuickCaptureMode } from "./QuickCaptureHeader";
import { QuickCaptureReminder } from "./QuickCaptureReminder";
import { QuickCaptureRecord } from "./QuickCaptureRecord";
import { QuickSearchList } from "./QuickSearchList";
import { useCaptureActions } from "./useCaptureActions";
import { useCaptureKeybindings } from "./useCaptureKeybindings";
import { useCaptureTheme } from "./useCaptureTheme";
import { useQuickSearch } from "./useQuickSearch";
import { restoreCachedBuiltinTheme } from "../../themes";
import styles from "./QuickCapture.module.scss";
import { Input } from "@app/design-system";

export const MAX_CAPTURE_CHARS = 10_000;

export interface QuickCaptureProps {
  onSave?: (text: string, filename?: string, folder?: string) => Promise<void> | void;
  onDismiss?: () => Promise<void> | void;
  onOpenNote?: (path: string) => Promise<void> | void;
  initialMode?: QuickCaptureMode;
  searchFn?: (query: string) => Promise<SearchResult[]>;
}

export function QuickCapture(props: QuickCaptureProps) {
  const { onSave, onDismiss, onOpenNote, initialMode = "capture", searchFn } = props;
  const [mode, setMode] = useState<QuickCaptureMode>(initialMode);
  const [autoStartRecord, setAutoStartRecord] = useState(false);
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("");
  const [folder, setFolder] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useCaptureTheme();
  const search = useQuickSearch({ searchFn });
  const { query, setQuery, results, selectedIndex, setSelectedIndex } = search;

  const {
    savedDestination,
    errorMessage,
    setErrorMessage,
    handleDismiss,
    handleSave,
    handleOpenNote,
  } = useCaptureActions({
    onSave,
    onDismiss,
    onOpenNote,
    filename,
    folder,
    setText,
    setFilename,
    setFolder,
    setMode,
    setAutoStartRecord,
    resetSearch: search.resetSearch,
  });

  useEffect(() => {
    const focusActive = () => {
      if (mode === "capture") textareaRef.current?.focus();
      else if (mode === "search") searchInputRef.current?.focus();
    };
    focusActive();
    void (async () => {
      try {
        const { getCurrentWindow, LogicalSize } = await import("@tauri-apps/api/window");
        await getCurrentWindow().setSize(new LogicalSize(780, 520));
        await invoke("reclamp_capture_popover");
      } catch {
        // Ignored outside Tauri
      }
    })();
    let unlisten: (() => void) | undefined;
    void listen("davinci-capture-focus", () => {
      restoreCachedBuiltinTheme();
      focusActive();
    }).then((fn) => { unlisten = fn; }).catch(() => {});
    return () => { unlisten?.(); };
  }, [mode]);

  const handleStartRecord = () => {
    setAutoStartRecord(true);
    setMode("record");
  };

  const { handleCaptureKeyDown, handleSearchKeyDown } = useCaptureKeybindings({
    setMode,
    text,
    onSave: (c) => void handleSave(c),
    onDismiss: () => void handleDismiss(),
    onOpenNote: (p) => void handleOpenNote(p),
    onStartRecord: handleStartRecord,
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
        onModeChange={(m) => { setAutoStartRecord(false); setMode(m); }}
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
            placeholder="Type a thought... (Tab for note name, ⌘S to save, ⌘R to record, Esc to quit)"
            onChange={(e) => {
              setText(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            onKeyDown={handleCaptureKeyDown}
            aria-label="Quick capture text"
          />
          <QuickCaptureDestination
            filename={filename}
            onFilenameChange={(name) => { setFilename(name); if (errorMessage) setErrorMessage(null); }}
            folder={folder}
            onFolderChange={(f) => { setFolder(f); if (errorMessage) setErrorMessage(null); }}
            onSave={() => void handleSave(text)}
            onDismiss={() => void handleDismiss()}
            nameInputRef={nameInputRef}
          />
        </>
      ) : mode === "reminder" ? (
        <QuickCaptureReminder
          onSaveReminder={handleSave}
          onDismiss={() => void handleDismiss()}
          folder={folder}
          onFolderChange={setFolder}
        />
      ) : mode === "record" ? (
        <QuickCaptureRecord
          onSaveRecord={handleSave}
          onDismiss={() => void handleDismiss()}
          folder={folder}
          onFolderChange={setFolder}
          initialNotes={text}
          autoStart={autoStartRecord}
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

      {mode !== "reminder" && mode !== "record" && (
        <QuickCaptureFooter
          mode={mode}
          canSave={text.trim().length > 0}
          onSave={() => void handleSave(text)}
          onDismiss={() => void handleDismiss()}
          onRecord={handleStartRecord}
        />
      )}
    </div>
  );
}
