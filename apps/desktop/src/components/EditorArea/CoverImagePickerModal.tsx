import { useState, useCallback } from "react";
import {
  X,
  Image as ImageIcon,
  UploadSimple,
  LinkSimple,
  Trash,
} from "@phosphor-icons/react";
import { COVER_PRESETS } from "./coverPresets";
import styles from "./CoverImagePickerModal.module.scss";

export interface CoverImagePickerModalProps {
  currentCover?: string | null;
  onSelectCover: (url: string, defaultY?: number) => void;
  onRemoveCover?: () => void;
  onPickLocalFile?: () => Promise<string | null>;
  onClose: () => void;
}

type TabType = "gallery" | "upload" | "link";

export function CoverImagePickerModal({
  currentCover,
  onSelectCover,
  onRemoveCover,
  onPickLocalFile,
  onClose,
}: CoverImagePickerModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("gallery");
  const [customUrl, setCustomUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handlePickFile = useCallback(async () => {
    if (!onPickLocalFile) return;
    try {
      setIsUploading(true);
      const filePath = await onPickLocalFile();
      if (filePath) {
        onSelectCover(filePath, 50);
        onClose();
      }
    } finally {
      setIsUploading(false);
    }
  }, [onPickLocalFile, onSelectCover, onClose]);

  const handleApplyCustomUrl = useCallback(() => {
    const trimmed = customUrl.trim();
    if (!trimmed) return;
    onSelectCover(trimmed, 50);
    onClose();
  }, [customUrl, onSelectCover, onClose]);

  return (
    <div
      className={styles["cover-picker-overlay"]}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-label="Cover Image Picker"
    >
      <div className={styles["cover-picker-modal"]}>
        <div className={styles["cover-picker-header"]}>
          <h3 className={styles["cover-picker-title"]}>Cover Image</h3>
          <button
            type="button"
            className={styles["cover-picker-close-button"]}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <div className={styles["cover-picker-tabs"]} role="tablist">
          <button
            type="button"
            className={styles["cover-picker-tab"]}
            data-active={activeTab === "gallery"}
            onClick={() => setActiveTab("gallery")}
          >
            <ImageIcon size={16} /> Gallery
          </button>
          <button
            type="button"
            className={styles["cover-picker-tab"]}
            data-active={activeTab === "upload"}
            onClick={() => setActiveTab("upload")}
          >
            <UploadSimple size={16} /> Upload
          </button>
          <button
            type="button"
            className={styles["cover-picker-tab"]}
            data-active={activeTab === "link"}
            onClick={() => setActiveTab("link")}
          >
            <LinkSimple size={16} /> Link
          </button>
        </div>

        <div className={styles["cover-picker-body"]}>
          {activeTab === "gallery" && (
            <div className={styles["cover-picker-gallery"]}>
              {COVER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={styles["cover-preset-card"]}
                  onClick={() => {
                    onSelectCover(preset.url, preset.defaultY ?? 50);
                    onClose();
                  }}
                  title={preset.name}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className={styles["cover-preset-thumb"]}
                    loading="lazy"
                  />
                  <span className={styles["cover-preset-label"]}>
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {activeTab === "upload" && (
            <div className={styles["cover-picker-section"]}>
              <p style={{ margin: 0, fontSize: "var(--type-scale-sm)" }}>
                Upload an image from your computer to use as note banner.
              </p>
              <button
                type="button"
                className={styles["cover-picker-button"]}
                onClick={() => void handlePickFile()}
                disabled={isUploading || !onPickLocalFile}
                data-variant="accent"
              >
                <UploadSimple size={16} />
                {isUploading ? "Uploading..." : "Choose Image File"}
              </button>
            </div>
          )}

          {activeTab === "link" && (
            <div className={styles["cover-picker-section"]}>
              <div className={styles["cover-picker-input-group"]}>
                <input
                  type="url"
                  className={styles["cover-picker-input"]}
                  placeholder="Paste an image link (e.g. Unsplash URL)..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplyCustomUrl();
                  }}
                />
                <button
                  type="button"
                  className={styles["cover-picker-button"]}
                  data-variant="accent"
                  onClick={handleApplyCustomUrl}
                  disabled={!customUrl.trim()}
                >
                  Apply
                </button>
              </div>
              {customUrl.trim().startsWith("http") && (
                <div className={styles["cover-picker-preview-wrapper"]}>
                  <img
                    src={customUrl.trim()}
                    alt="Preview"
                    className={styles["cover-picker-preview-img"]}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {currentCover && onRemoveCover && (
          <div className={styles["cover-picker-footer"]}>
            <button
              type="button"
              className={styles["cover-picker-button"]}
              data-variant="danger"
              onClick={() => {
                onRemoveCover();
                onClose();
              }}
            >
              <Trash size={16} /> Remove Cover
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
