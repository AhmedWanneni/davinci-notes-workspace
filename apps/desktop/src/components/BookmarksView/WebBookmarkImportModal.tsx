import React, { useEffect, useRef, useState } from "react";
import { Globe, Sparkle, UploadSimple, X } from "@phosphor-icons/react";
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
import webStyles from "./WebBookmarks.module.scss";
import catStyles from "./WebBookmarksCategoryView.module.scss";

export interface WebBookmarkImportModalProps {
  onImport: (items: readonly WebBookmarkItem[], organizeWithAI: boolean) => void;
  onClose: () => void;
}

export function WebBookmarkImportModal({
  onImport,
  onClose,
}: WebBookmarkImportModalProps) {
  const [browsers, setBrowsers] = useState<readonly DetectedBrowserInfo[]>(DEFAULT_BROWSERS);
  const [selectedBrowser, setSelectedBrowser] = useState<SupportedBrowserId | null>(null);
  const [loadingBrowser, setLoadingBrowser] = useState<SupportedBrowserId | null>(null);
  const [summary, setSummary] = useState<BrowserImportSummary | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [organizeWithAI, setOrganizeWithAI] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void detectInstalledBrowsers().then((detected) => {
      if (active && detected.length > 0) setBrowsers(detected);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleBrowserClick = async (browser: DetectedBrowserInfo) => {
    setSelectedBrowser(browser.id);
    setLoadingBrowser(browser.id);
    setError(null);
    try {
      const parsed = await autoImportFromBrowser(browser.id);
      if (parsed.items.length === 0) {
        setSummary(null);
        setError(`No bookmarks found automatically in ${browser.name}. Try another browser or upload an exported file below.`);
        return;
      }
      setSourceLabel(browser.name);
      setSummary(parsed);
    } catch (err) {
      setSummary(null);
      setError(err instanceof Error ? err.message : `Could not read bookmarks from ${browser.name}.`);
    } finally {
      setLoadingBrowser(null);
    }
  };

  const handleFileContent = (name: string, content: string) => {
    setSelectedBrowser(null);
    setSourceLabel(name);
    const parsed = parseImportedBookmarksFile(content);
    if (parsed.items.length === 0) {
      setError("No valid http/https bookmarks were found in this file. Please export bookmarks as HTML or JSON from your browser.");
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
    <div
      className={webStyles["modal-backdrop"]}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Import Browser Bookmarks"
    >
      <div className={webStyles["modal-card"]} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
            Import Bookmarks from Browser
          </h2>
          <button type="button" className={webStyles["action-btn"]} onClick={onClose} aria-label="Close import dialog">
            <X size={14} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600 }}>
            1. Choose your browser to automatically import bookmarks:
          </span>
          <div className={catStyles["browser-grid"]} role="group" aria-label="Choose browser for automatic import">
            {browsers.map((browser) => {
              const isSelected = selectedBrowser === browser.id;
              const isLoading = loadingBrowser === browser.id;
              return (
                <button
                  key={browser.id}
                  type="button"
                  data-testid={`browser-card-${browser.id}`}
                  className={`${catStyles["browser-card"]} ${isSelected ? catStyles["is-selected"] : ""}`}
                  disabled={loadingBrowser !== null}
                  onClick={() => void handleBrowserClick(browser)}
                >
                  <div className={catStyles["browser-card-top"]}>
                    <span className={catStyles["browser-name"]}>
                      <Globe size={13} style={{ marginRight: "4px", verticalAlign: "-2px" }} />
                      {browser.name}
                    </span>
                    {browser.available && (
                      <span className={`${catStyles["browser-badge"]} ${catStyles["is-detected"]}`}>
                        Detected
                      </span>
                    )}
                  </div>
                  <span className={catStyles["browser-sub"]}>
                    {isLoading ? "Reading bookmarks..." : "Auto-import"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={`${webStyles["dropzone"]} ${isDragOver ? webStyles["is-dragover"] : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFileSelect(e.dataTransfer.files?.[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Choose bookmark file to upload"
        >
          <UploadSimple size={20} />
          <span style={{ fontSize: "12px" }}>
            {sourceLabel && !selectedBrowser
              ? `Selected file: ${sourceLabel}`
              : "Or click / drop an exported bookmarks .html or .json file"}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,.json,text/html,application/json"
            style={{ display: "none" }}
            data-testid="bookmark-import-file-input"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
        </div>

        <div className={webStyles["browser-hints"]}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "var(--color-text-normal)" }}>
            <input type="checkbox" checked={organizeWithAI} onChange={(e) => setOrganizeWithAI(e.target.checked)} />
            <Sparkle size={14} />
            <span><strong>Organize bookmarks by category</strong> automatically (Smart Categories / AI)</span>
          </label>
          {summary && (
            <strong style={{ marginTop: "4px", color: "var(--color-text-normal)" }}>
              Ready to import {summary.items.length} bookmark{summary.items.length === 1 ? "" : "s"}
              {sourceLabel ? ` from ${sourceLabel}` : ""}
              {summary.folders.length > 0 ? ` (${summary.folders.length} existing folder${summary.folders.length === 1 ? "" : "s"})` : ""}
            </strong>
          )}
        </div>

        {error && <div role="alert" style={{ fontSize: "12px" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
          <button type="button" className={webStyles["action-btn"]} onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={`${webStyles["action-btn"]} ${webStyles["is-primary"]}`}
            disabled={!summary || summary.items.length === 0}
            onClick={() => summary && onImport(summary.items, organizeWithAI)}
          >
            Import {summary ? `${summary.items.length} Links` : "Bookmarks"}
          </button>
        </div>
      </div>
    </div>
  );
}
