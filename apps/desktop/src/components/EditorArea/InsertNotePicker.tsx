import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  extractNoteHeadings,
  pathStem,
  resolveWikilinkTargetForPath,
} from "@app/editor";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { readNote } from "../../vault";
import styles from "./InsertNotePicker.module.scss";

export interface InsertNotePickerProps {
  onSelect: (target: string, heading?: string) => void;
  onCancel: () => void;
  notePaths?: readonly string[];
  readNoteContent?: (path: string) => Promise<string | null>;
}

export function InsertNotePicker({
  onSelect,
  onCancel,
  notePaths: propNotePaths,
  readNoteContent,
}: InsertNotePickerProps) {
  const storeNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const paths = propNotePaths ?? storeNotePaths;

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [headings, setHeadings] = useState<Array<{ heading: string; level: number }>>([]);
  const [headingIndex, setHeadingIndex] = useState(0);
  const [step, setStep] = useState<"pick-note" | "pick-heading">("pick-note");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const filteredNotes = useMemo(() => {
    const norm = query.trim().toLowerCase();
    if (!norm) return paths.slice(0, 30);
    return paths
      .filter((p) => {
        const stem = pathStem(p);
        return stem.toLowerCase().includes(norm) || p.toLowerCase().includes(norm);
      })
      .slice(0, 30);
  }, [paths, query]);

  const handleChooseNote = async (path: string) => {
    setSelectedNote(path);
    try {
      const content = readNoteContent
        ? await readNoteContent(path)
        : (await readNote(path)).content;
      if (content) {
        const found = extractNoteHeadings(content);
        if (found.length > 0) {
          setHeadings(found);
          setHeadingIndex(0);
          setStep("pick-heading");
          return;
        }
      }
    } catch {
      // Fallback: confirm without headings if reading fails
    }
    const target = resolveWikilinkTargetForPath(path, paths);
    onSelect(target);
  };

  const handleConfirmHeading = (heading?: string) => {
    if (!selectedNote) return;
    const target = resolveWikilinkTargetForPath(selectedNote, paths);
    onSelect(target, heading);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (step === "pick-note") {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(filteredNotes.length - 1, prev + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Enter" && filteredNotes[selectedIndex]) {
        e.preventDefault();
        void handleChooseNote(filteredNotes[selectedIndex]!);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    } else {
      const totalOptions = headings.length + 1; // 0 is "(Entire note)"
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHeadingIndex((prev) => Math.min(totalOptions - 1, prev + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHeadingIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (headingIndex === 0) {
          handleConfirmHeading(undefined);
        } else {
          handleConfirmHeading(headings[headingIndex - 1]?.heading);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setStep("pick-note");
      }
    }
  };

  if (step === "pick-heading" && selectedNote) {
    return (
      <div className={styles["note-picker-root"]} onKeyDown={handleKeyDown} tabIndex={-1}>
        <div className={styles["note-picker-heading-header"]}>
          <span>Embed: <strong>{pathStem(selectedNote)}</strong></span>
          <button
            type="button"
            className={styles["note-picker-back-btn"]}
            onClick={() => setStep("pick-note")}
          >
            Change note
          </button>
        </div>
        <div className={styles["note-picker-list"]}>
          <button
            type="button"
            className={`${styles["note-picker-item"]} ${headingIndex === 0 ? styles["is-active"] : ""}`}
            onClick={() => handleConfirmHeading(undefined)}
          >
            <span className={styles["note-picker-title"]}>(Entire note)</span>
          </button>
          {headings.map((item, idx) => (
            <button
              key={`${item.heading}-${idx}`}
              type="button"
              className={`${styles["note-picker-item"]} ${headingIndex === idx + 1 ? styles["is-active"] : ""}`}
              onClick={() => handleConfirmHeading(item.heading)}
            >
              <span className={styles["note-picker-title"]}>
                {"  ".repeat(Math.max(0, item.level - 1))}# {item.heading}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles["note-picker-root"]} onKeyDown={handleKeyDown}>
      <input
        ref={inputRef}
        className={styles["note-picker-search"]}
        placeholder="Search notes to embed..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedIndex(0);
        }}
      />
      <div className={styles["note-picker-list"]}>
        {filteredNotes.length === 0 ? (
          <div className={styles["note-picker-empty"]}>No matching notes found</div>
        ) : (
          filteredNotes.map((path, idx) => (
            <button
              key={path}
              type="button"
              className={`${styles["note-picker-item"]} ${selectedIndex === idx ? styles["is-active"] : ""}`}
              onClick={() => void handleChooseNote(path)}
            >
              <span className={styles["note-picker-title"]}>{pathStem(path)}</span>
              {path.includes("/") && (
                <span className={styles["note-picker-detail"]}>
                  {path.slice(0, path.lastIndexOf("/"))}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
