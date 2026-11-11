import React, { useEffect, useRef, useState } from "react";
import { Sparkle, UploadSimple } from "@phosphor-icons/react";
import { WindowDialog } from "../WindowDialog";
import {
  autoImportFromBrowser,
  DEFAULT_BROWSERS,
  detectInstalledBrowsers,
  parseImportedBookmarksFile,
  type BrowserImportSummary,
  type DetectedBrowserInfo,
  type SupportedBrowserId,
} from "../../bookmarks/browserBookmarkImporter";
import type { WebBookmarkItem } from "../../bookmarks/bookmarkTypes";
import { WebBookmarkBrowserGrid } from "./WebBookmarkBrowserGrid";
import styles from "./WebBookmarkImportModal.module.scss";

export interface WebBookmarkImportModalProps {
  onImport: (items: readonly WebBookmarkItem[], organizeWithAI: boolean) => void;
  onClose: () => void;
}

export function WebBookmarkImportModal({
  onImport,
  onClose,
}: WebBookmarkImportModalProps) {
  const [browsers, setBrowsers] =
    useState<readonly DetectedBrowserInfo[]>(DEFAULT_BROWSERS);
  const [selectedBrowser, setSelectedBrowser] =
    useState<SupportedBrowserId | null>(null);
  const [loadingBrowser, setLoadingBrowser] =
    useState<SupportedBrowserId | null>(null);
  const [summary, setSummary] = useState<BrowserImportSummary | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [organizeWithAI, setOrganizeWithAI] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBrowserSummary = async (browser: DetectedBrowserInfo) => {
    setSelectedBrowser(browser.id);
    setLoadingBrowser(browser.id);
    setError(null);
    try {
      const parsed = await autoImportFromBrowser(browser.id);
      if (parsed.items.length === 0) {
        setSummary(null);
        setError(`No bookmarks found in ${browser.name}. Try another browser or upload a file.`);
        return null;
      }
      setSourceLabel(browser.name);
      setSummary(parsed);
      return parsed;
    } catch (err) {
      setSummary(null);
      setError(
        err instanceof Error ? err.message : `Could not read ${browser.name}.`,
      );
      return null;
    } finally {
      setLoadingBrowser(null);
    }
  };

  useEffect(() => {
    let active = true;
    void detectInstalledBrowsers().then((detected) => {
      if (!active || detected.length === 0) return;
      setBrowsers(detected);
      const primary = detected.find((b) => b.available) || detected[0];
      if (primary) void loadBrowserSummary(primary);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleDirectImport = async (browser: DetectedBrowserInfo) => {
    const res = await loadBrowserSummary(browser);
    if (res && res.items.length > 0) {
      onImport(res.items, organizeWithAI);
    }
  };

  const handleFooterImport = async () => {
    if (summary && summary.items.length > 0) {
      onImport(summary.items, organizeWithAI);
      return;
    }
    const candidate =
      browsers.find((b) => b.id === selectedBrowser) ||
      browsers.find((b) => b.available) ||
      browsers[0];
    if (candidate) {
      await handleDirectImport(candidate);
    }
  };

  const handleFileContent = (name: string, content: string) => {
    setSelectedBrowser(null);
    setSourceLabel(name);
    const parsed = parseImportedBookmarksFile(content);
    if (parsed.items.length === 0) {
      setError("No valid bookmarks found in this file.");
      setSummary(null);
      return;
    }
    setError(null);
    setSummary(parsed);
  };

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleFileContent(file.name, String(reader.result ?? ""));
    reader.onerror = () => setError("Could not read the selected file.");
    reader.readAsText(file);
  };

  return (
    <WindowDialog
      isOpen={true}
      onClose={onClose}
      title="Add Bookmarks from Browser"
      size="md"
      footer={
        <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "flex-end" }}>
          <button
            type="button"
            className={styles["action-btn"]}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${styles["action-btn"]} ${styles["is-primary"]}`}
            disabled={loadingBrowser !== null}
            onClick={() => void handleFooterImport()}
          >
            {loadingBrowser
              ? "Reading..."
              : summary
                ? `Import ${summary.items.length} Links`
                : "Import Bookmarks"}
          </button>
        </div>
      }
    >
      <div className={styles["dialog-body"]}>
            <div className={styles["section-header"]}>
              Choose your browser to automatically import bookmarks:
            </div>

            <WebBookmarkBrowserGrid
              browsers={browsers}
              selectedBrowser={selectedBrowser}
              loadingBrowser={loadingBrowser}
              onSelect={(b) => void loadBrowserSummary(b)}
              onDirectImport={(b) => void handleDirectImport(b)}
            />

            <div className={styles["menu-divider"]} />

            <button
              type="button"
              className={styles["menu-item"]}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Choose bookmark file to upload"
            >
              <span className={styles["menu-item-icon"]}>
                <UploadSimple size={16} />
              </span>
              <span className={styles["menu-item-text"]}>
                {sourceLabel && !selectedBrowser
                  ? `Selected: ${sourceLabel}`
                  : "Upload exported .html or .json file"}
              </span>
              <span className={styles["menu-item-meta"]}>HTML / JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.json,text/html,application/json"
              style={{ display: "none" }}
              data-testid="bookmark-import-file-input"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            <div className={styles["menu-footer-options"]}>
              <label className={styles["organize-label"]}>
                <input
                  type="checkbox"
                  checked={organizeWithAI}
                  onChange={(e) => setOrganizeWithAI(e.target.checked)}
                />
                <Sparkle size={13} />
                <span>
                  Organize bookmarks by category automatically (AI)
                </span>
              </label>
              {summary && (
                <span className={styles["summary-text"]}>
                  Ready to import {summary.items.length} bookmark
                  {summary.items.length === 1 ? "" : "s"}
                  {sourceLabel ? ` from ${sourceLabel}` : ""}
                  {summary.folders.length > 0
                    ? ` (${summary.folders.length} folder${summary.folders.length === 1 ? "" : "s"})`
                    : ""}
                </span>
              )}
            </div>

            {error && (
              <div role="alert" className={styles["error-msg"]}>
                {error}
              </div>
            )}
          </div>
    </WindowDialog>
  );
}
