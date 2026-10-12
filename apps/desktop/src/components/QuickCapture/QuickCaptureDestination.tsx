import { useState, useRef, type KeyboardEvent, type RefObject } from "react";
import { invoke } from "@tauri-apps/api/core";
import styles from "./QuickCaptureDestination.module.scss";

export interface QuickCaptureDestinationProps {
  filename: string;
  onFilenameChange: (name: string) => void;
  folder: string;
  onFolderChange: (folder: string) => void;
  onSave: () => void;
  onDismiss: () => void;
  nameInputRef?: RefObject<HTMLInputElement | null>;
}

export function QuickCaptureDestination({
  filename,
  onFilenameChange,
  folder,
  onFolderChange,
  onSave,
  onDismiss,
  nameInputRef,
}: QuickCaptureDestinationProps) {
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [foldersLoaded, setFoldersLoaded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const folderInputRef = useRef<HTMLInputElement>(null);

  const loadFolders = async () => {
    if (foldersLoaded) return;
    try {
      const list = await invoke<string[]>("list_vault_folders_for_capture");
      setAvailableFolders(list);
      setFoldersLoaded(true);
    } catch {
      // Ignored outside Tauri / on error
    }
  };

  const filteredFolders = availableFolders.filter((f) =>
    f.toLowerCase().includes(folder.toLowerCase().trim()),
  );

  const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const isSave =
      e.key === "Enter" ||
      ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "Enter"));
    if (isSave) {
      e.preventDefault();
      onSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onDismiss();
    }
  };

  const handleFolderKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isDropdownOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredFolders.length - 1 ? prev + 1 : 0,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredFolders.length - 1,
        );
        return;
      }
      if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        const selected = filteredFolders[highlightedIndex];
        if (selected) onFolderChange(selected);
        setIsDropdownOpen(false);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setIsDropdownOpen(false);
        return;
      }
    }

    const isSave =
      e.key === "Enter" ||
      ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "Enter"));
    if (isSave) {
      e.preventDefault();
      onSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onDismiss();
    }
  };

  return (
    <div className={styles["quick-capture-destination"]}>
      <div className={styles["quick-capture-field"]}>
        <input
          ref={nameInputRef}
          type="text"
          className={styles["quick-capture-input"]}
          value={filename}
          placeholder="Note name (optional)"
          onChange={(e) => onFilenameChange(e.target.value)}
          onKeyDown={handleNameKeyDown}
          aria-label="Note name"
        />
      </div>

      <div className={styles["quick-capture-field"]}>
        <input
          ref={folderInputRef}
          type="text"
          className={styles["quick-capture-input"]}
          value={folder}
          placeholder="Folder: Quick Notes/ (default)"
          onFocus={() => {
            void loadFolders();
            setIsDropdownOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => setIsDropdownOpen(false), 200);
          }}
          onChange={(e) => {
            onFolderChange(e.target.value);
            setIsDropdownOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleFolderKeyDown}
          aria-label="Note folder"
          role="combobox"
          aria-expanded={isDropdownOpen}
        />

        {isDropdownOpen && filteredFolders.length > 0 && (
          <ul
            className={styles["quick-capture-folder-dropdown"]}
            role="listbox"
          >
            {filteredFolders.slice(0, 8).map((item, idx) => (
              <li
                key={item}
                className={`${styles["quick-capture-folder-item"]} ${
                  idx === highlightedIndex ? styles["is-selected"] : ""
                }`}
                role="option"
                aria-selected={idx === highlightedIndex}
                onMouseDown={() => {
                  onFolderChange(item);
                  setIsDropdownOpen(false);
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
