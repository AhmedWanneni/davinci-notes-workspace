import React from "react";
import { Globe } from "@phosphor-icons/react";
import type {
  DetectedBrowserInfo,
  SupportedBrowserId,
} from "../../bookmarks/browserBookmarkImporter";
import styles from "./WebBookmarkAddBar.module.scss";

export interface WebBookmarkBrowserPickerProps {
  browsers: readonly DetectedBrowserInfo[];
  selectedBrowserId?: SupportedBrowserId | null;
  isLoading?: boolean;
  onSelectBrowser: (browser: DetectedBrowserInfo) => void;
  onCancel?: () => void;
}

export function WebBookmarkBrowserPicker({
  browsers,
  selectedBrowserId,
  isLoading = false,
  onSelectBrowser,
  onCancel,
}: WebBookmarkBrowserPickerProps) {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = browsers.find((b) => b.id === e.target.value);
    if (found) onSelectBrowser(found);
  };

  return (
    <div className={styles["browser-picker"]} role="region" aria-label="Choose browser">
      <div className={styles["picker-header"]}>
        <span className={styles["picker-title"]}>
          Choose which browser to add bookmarks from:
        </span>
        <select
          className={styles["browser-select"]}
          value={selectedBrowserId ?? ""}
          onChange={handleSelectChange}
          disabled={isLoading}
          aria-label="Select browser dropdown"
        >
          <option value="" disabled>
            Select a browser...
          </option>
          {browsers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} {b.available ? "(detected)" : ""}
            </option>
          ))}
        </select>
        {onCancel && (
          <button
            type="button"
            className={styles["action-btn"]}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
      </div>

      <div className={styles["browser-grid"]} role="group" aria-label="Supported browsers">
        {browsers.map((b) => {
          const isSelected = selectedBrowserId === b.id;
          return (
            <button
              key={b.id}
              type="button"
              className={`${styles["browser-chip"]} ${isSelected ? styles["is-selected"] : ""}`}
              onClick={() => onSelectBrowser(b)}
              disabled={isLoading}
              aria-label={`Select ${b.name}`}
            >
              <Globe size={14} className={styles["browser-icon"]} />
              <span className={styles["browser-name"]}>{b.name}</span>
              {b.available && (
                <span className={styles["detected-badge"]}>Detected</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
