import { useState, useEffect } from "react";
import { LinkSimple, Globe } from "@phosphor-icons/react";
import type {
  WebBookmarkInput,
  WebBookmarkItem,
} from "../../bookmarks/bookmarkTypes";
import {
  DEFAULT_BROWSERS,
  detectInstalledBrowsers,
  autoImportFromBrowser,
  type DetectedBrowserInfo,
  type BrowserImportSummary,
} from "../../bookmarks/browserBookmarkImporter";
import { WebBookmarkManualForm } from "./WebBookmarkManualForm";
import { WebBookmarkBrowserPicker } from "./WebBookmarkBrowserPicker";
import { WebBookmarkBrowserList } from "./WebBookmarkBrowserList";
import styles from "./WebBookmarkAddBar.module.scss";

export interface WebBookmarkAddBarProps {
  onAdd: (input: WebBookmarkInput) => void;
  onAddBatch?: (items: readonly WebBookmarkItem[]) => void;
  onCancel: () => void;
  initialMode?: "manual" | "browser";
}

export function WebBookmarkAddBar({
  onAdd,
  onAddBatch,
  onCancel,
  initialMode = "manual",
}: WebBookmarkAddBarProps) {
  const [mode, setMode] = useState<"manual" | "browser">(initialMode);
  const [manualValues, setManualValues] = useState<Partial<WebBookmarkInput>>();
  const [browsers, setBrowsers] =
    useState<readonly DetectedBrowserInfo[]>(DEFAULT_BROWSERS);
  const [selectedBrowser, setSelectedBrowser] =
    useState<DetectedBrowserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<BrowserImportSummary | null>(null);
  const [browserError, setBrowserError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void detectInstalledBrowsers().then((detected) => {
      if (active && detected.length > 0) setBrowsers(detected);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSelectBrowser = async (browser: DetectedBrowserInfo) => {
    setSelectedBrowser(browser);
    setIsLoading(true);
    setBrowserError(null);
    setSummary(null);
    try {
      const res = await autoImportFromBrowser(browser.id);
      if (res.items.length === 0) {
        setBrowserError(`No bookmarks found in ${browser.name}.`);
      } else {
        setSummary(res);
      }
    } catch (err) {
      setBrowserError(
        err instanceof Error ? err.message : `Failed to read ${browser.name}.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseInForm = (b: WebBookmarkItem) => {
    setManualValues({
      url: b.url,
      title: b.title,
      folder: b.folder,
      tags: b.tags,
    });
    setMode("manual");
  };

  const handleAddAllFromBrowser = () => {
    if (!summary || summary.items.length === 0) return;
    if (onAddBatch) {
      onAddBatch(summary.items);
    } else {
      summary.items.forEach((b) =>
        onAdd({
          url: b.url,
          title: b.title,
          domain: b.domain,
          folder: b.folder,
          tags: b.tags,
        }),
      );
    }
  };

  return (
    <div className={styles["add-container"]} aria-label="Add web bookmark">
      <div className={styles["mode-tabs"]}>
        <button
          type="button"
          className={`${styles["mode-tab"]} ${mode === "manual" ? styles["is-active"] : ""}`}
          onClick={() => setMode("manual")}
        >
          <LinkSimple size={13} />
          <span>Manual link</span>
        </button>
        <button
          type="button"
          className={`${styles["mode-tab"]} ${mode === "browser" ? styles["is-active"] : ""}`}
          onClick={() => setMode("browser")}
        >
          <Globe size={13} />
          <span>Add from browser</span>
        </button>
      </div>

      {mode === "manual" ? (
        <WebBookmarkManualForm
          key={manualValues?.url ?? "new"}
          onAdd={onAdd}
          onSwitchToBrowser={() => setMode("browser")}
          onCancel={onCancel}
          initialValues={manualValues}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {!selectedBrowser || browserError ? (
            <>
              <WebBookmarkBrowserPicker
                browsers={browsers}
                selectedBrowserId={selectedBrowser?.id}
                isLoading={isLoading}
                onSelectBrowser={(b) => void handleSelectBrowser(b)}
                onCancel={onCancel}
              />
              {isLoading && (
                <span className={styles["status-msg"]}>
                  Reading bookmarks from {selectedBrowser?.name}...
                </span>
              )}
              {browserError && (
                <div role="alert" className={styles["status-msg"]}>
                  {browserError}
                </div>
              )}
            </>
          ) : isLoading ? (
            <span className={styles["status-msg"]}>
              Reading bookmarks from {selectedBrowser.name}...
            </span>
          ) : summary ? (
            <WebBookmarkBrowserList
              browserName={selectedBrowser.name}
              items={summary.items}
              onAddSingle={(b) =>
                onAdd({
                  url: b.url,
                  title: b.title,
                  domain: b.domain,
                  folder: b.folder,
                  tags: b.tags,
                })
              }
              onUseInForm={handleUseInForm}
              onAddAll={handleAddAllFromBrowser}
              onChangeBrowser={() => {
                setSelectedBrowser(null);
                setSummary(null);
                setBrowserError(null);
              }}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
