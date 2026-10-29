import type { KeyboardEvent } from "react";
import { Typography } from "@app/design-system";
import {
  useQuickRecord,
  formatTimer,
  getDefaultRecordTitle,
} from "./useQuickRecord";
import { QuickCaptureRecordControls } from "./QuickCaptureRecordControls";
import styles from "./QuickCaptureRecord.module.scss";

export interface QuickCaptureRecordProps {
  onSaveRecord: (
    noteContent: string,
    filename: string,
    folder?: string,
    audioRelPath?: string,
  ) => Promise<void> | void;
  onDismiss: () => void;
  folder: string;
  onFolderChange: (folder: string) => void;
}

export function QuickCaptureRecord({
  onSaveRecord,
  onDismiss,
  folder,
  onFolderChange,
}: QuickCaptureRecordProps) {
  const {
    status,
    setStatus,
    elapsed,
    tempWavPath,
    title,
    setTitle,
    noteText,
    setNoteText,
    errorMessage,
    setErrorMessage,
    handleStart,
    handlePause,
    handleResume,
    handleStop,
    handleDiscard,
    buildNoteContent,
    saveRecordedAudioToVault,
  } = useQuickRecord();

  const handleSave = async () => {
    setStatus("saving");
    try {
      const cleanTitle = title.trim().replace(/[\\/:*?"<>|]/g, " ") || getDefaultRecordTitle();
      const audioFileName = `${cleanTitle}.wav`;
      const noteFileName = `${cleanTitle}.md`;
      const targetFolder = folder.trim() || "Voice Notes";
      const targetAudioRel = `${targetFolder}/${audioFileName}`;

      if (tempWavPath) {
        await saveRecordedAudioToVault(tempWavPath, targetAudioRel).catch(() => {});
      }

      const noteContent = buildNoteContent(audioFileName, cleanTitle);
      await onSaveRecord(noteContent, noteFileName, targetFolder, targetAudioRel);
    } catch {
      setErrorMessage("Failed to save audio note to vault.");
      setStatus("recorded");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const isMod = e.ctrlKey || e.metaKey;
    if (e.key === "Escape") {
      e.preventDefault();
      void handleDiscard().then(onDismiss);
    } else if (isMod && e.key === "s" && status === "recorded") {
      e.preventDefault();
      void handleSave();
    }
  };

  return (
    <div
      className={styles["record-container"]}
      role="region"
      aria-label="Voice recording section"
      onKeyDown={handleKeyDown}
    >
      <div className={`${styles["record-status-row"]} ${status === "recording" ? styles["is-recording"] : ""}`}>
        <div className={styles["record-badge"]}>
          <span className={styles["record-indicator-dot"]} />
          <span>
            {status === "idle" && "Ready to record"}
            {status === "recording" && "Recording audio..."}
            {status === "paused" && "Recording paused"}
            {status === "recorded" && "Audio captured"}
            {status === "saving" && "Saving to vault..."}
          </span>
        </div>
        <span className={styles["record-timer"]}>{formatTimer(elapsed)}</span>
      </div>

      <div className={styles["record-field"]}>
        <Typography variant="text" size="xs" color="muted" weight="medium">
          Note Title
        </Typography>
        <input
          className={styles["record-input"]}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Voice note title..."
          disabled={status === "recording"}
          aria-label="Voice note title"
        />
      </div>

      <div className={styles["record-field"]}>
        <Typography variant="text" size="xs" color="muted" weight="medium">
          Folder
        </Typography>
        <input
          className={styles["record-input"]}
          value={folder}
          onChange={(e) => onFolderChange(e.target.value)}
          placeholder="Destination folder (default: Voice Notes)"
          disabled={status === "recording"}
          aria-label="Destination folder"
        />
      </div>

      <div className={styles["record-field"]}>
        <Typography variant="text" size="xs" color="muted" weight="medium">
          Notes (optional)
        </Typography>
        <textarea
          className={styles["record-textarea"]}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Type any quick thoughts or transcript to accompany the audio..."
          aria-label="Recording notes"
        />
      </div>

      {errorMessage && (
        <Typography variant="text" size="xs" color="muted">
          {errorMessage}
        </Typography>
      )}

      <QuickCaptureRecordControls
        status={status}
        onStart={() => void handleStart()}
        onPause={() => void handlePause()}
        onResume={() => void handleResume()}
        onStop={() => void handleStop()}
        onSave={() => void handleSave()}
        onDiscard={() => void handleDiscard()}
        onCancel={() => void handleDiscard().then(onDismiss)}
      />
    </div>
  );
}
