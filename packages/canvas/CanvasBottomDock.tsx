import {
  memo,
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type JSX,
} from "react";
import { Article, FileText, Image as ImageIcon } from "@phosphor-icons/react";
import styles from "./CanvasBottomDock.module.scss";

export interface CanvasBottomDockProps {
  allNotePaths: readonly string[];
  onCreateTextCard: () => void;
  onCreateFileCard: (filePath: string) => void;
  onPickMedia?: () => Promise<string | null | void>;
  onSaveMediaFile?: (fileName: string, data: Uint8Array) => Promise<string>;
}

function CanvasBottomDockComponent({
  allNotePaths,
  onCreateTextCard,
  onCreateFileCard,
  onPickMedia,
  onSaveMediaFile,
}: CanvasBottomDockProps): JSX.Element {
  const [showNotePicker, setShowNotePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredNotes = allNotePaths.filter((path) =>
    path.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectNote = useCallback(
    (path: string) => {
      onCreateFileCard(path);
      setShowNotePicker(false);
      setSearchQuery("");
    },
    [onCreateFileCard],
  );

  const handleMediaClick = useCallback(async () => {
    if (onPickMedia) {
      const picked = await onPickMedia();
      if (picked) {
        onCreateFileCard(picked);
        return;
      }
    }
    fileInputRef.current?.click();
  }, [onCreateFileCard, onPickMedia]);

  const handleFileInputChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (onSaveMediaFile) {
        try {
          const buffer = await file.arrayBuffer();
          const savedPath = await onSaveMediaFile(
            `attachments/${file.name}`,
            new Uint8Array(buffer),
          );
          onCreateFileCard(savedPath);
        } catch (err) {
          console.error("Failed to save media file", err);
        }
      } else {
        const url = URL.createObjectURL(file);
        onCreateFileCard(url);
      }
      e.target.value = "";
    },
    [onCreateFileCard, onSaveMediaFile],
  );

  return (
    <div
      className={styles["bottom-dock"]}
      role="toolbar"
      aria-label="Canvas creation tools"
    >
      <button
        type="button"
        className={styles["dock-btn"]}
        onClick={() => setShowNotePicker((v) => !v)}
        title="Add note from vault"
        aria-label="Add note from vault"
      >
        <FileText size={20} />
      </button>

      <button
        type="button"
        className={styles["dock-btn"]}
        onClick={onCreateTextCard}
        title="Add text card"
        aria-label="Add Text Card"
      >
        <Article size={20} />
      </button>

      <button
        type="button"
        className={styles["dock-btn"]}
        onClick={() => void handleMediaClick()}
        title="Add media"
        aria-label="Add media"
      >
        <ImageIcon size={20} />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,application/pdf"
        style={{ display: "none" }}
        onChange={(e) => void handleFileInputChange(e)}
      />

      {showNotePicker && (
        <div className={styles["dock-popover"]}>
          <input
            type="text"
            className={styles["dock-search"]}
            placeholder="Search notes..."
            value={searchQuery}
            autoFocus
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className={styles["dock-list"]}>
            {filteredNotes.length === 0 ? (
              <div
                style={{
                  padding: "8px 12px",
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                }}
              >
                No notes found
              </div>
            ) : (
              filteredNotes.map((path) => (
                <button
                  key={path}
                  type="button"
                  className={styles["dock-item"]}
                  onClick={() => handleSelectNote(path)}
                >
                  <FileText size={14} />
                  <span>{path}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const CanvasBottomDock = memo(CanvasBottomDockComponent);
