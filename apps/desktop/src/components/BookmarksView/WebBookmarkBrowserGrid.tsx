import React from "react";
import { Globe, CaretRight } from "@phosphor-icons/react";
import type {
  DetectedBrowserInfo,
  SupportedBrowserId,
} from "../../bookmarks/browserBookmarkImporter";
import styles from "./WebBookmarkImportModal.module.scss";

export interface WebBookmarkBrowserGridProps {
  browsers: readonly DetectedBrowserInfo[];
  selectedBrowser: SupportedBrowserId | null;
  loadingBrowser: SupportedBrowserId | null;
  onSelect: (browser: DetectedBrowserInfo) => void;
  onDirectImport?: (browser: DetectedBrowserInfo) => void;
}

export function WebBookmarkBrowserGrid({
  browsers,
  selectedBrowser,
  loadingBrowser,
  onSelect,
  onDirectImport,
}: WebBookmarkBrowserGridProps) {
  return (
    <div
      className={styles["menu-list"]}
      role="group"
      aria-label="Choose browser for automatic import"
    >
      {browsers.map((browser) => {
        const isSelected = selectedBrowser === browser.id;
        const isLoading = loadingBrowser === browser.id;
        return (
          <div
            key={browser.id}
            role="button"
            tabIndex={0}
            data-testid={`browser-card-${browser.id}`}
            className={`${styles["menu-item"]} ${isSelected ? styles["is-selected"] : ""}`}
            onClick={() => onSelect(browser)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(browser);
              }
            }}
          >
            <span className={styles["menu-item-icon"]}>
              <Globe size={16} />
            </span>
            <span className={styles["menu-item-text"]}>{browser.name}</span>
            <span className={styles["menu-item-meta"]}>
              {isLoading ? (
                "Reading..."
              ) : (
                <>
                  {browser.available && (
                    <button
                      type="button"
                      className={styles["row-import-btn"]}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDirectImport?.(browser);
                      }}
                      title={`Import bookmarks from ${browser.name}`}
                      aria-label={`Import bookmarks from ${browser.name}`}
                    >
                      Import
                    </button>
                  )}
                  <CaretRight size={13} />
                </>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
