import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "@app/design-system";
import { SettingsRow } from "./SettingsRow";
import styles from "./SettingsDialog.module.scss";

export function CaptureSettingsSection() {
  const [shortcut, setShortcut] = useState("Control+Alt+N");
  const [targetNote, setTargetNote] = useState("temporary/Inbox.md");
  const [shortcutError, setShortcutError] = useState<string | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void invoke<string>("get_capture_shortcut")
      .then((val) => {
        if (mounted && val) {
          setShortcut(val);
        }
      })
      .catch(() => {
        // Fallback to default
      });

    void invoke<string>("get_capture_target")
      .then((val) => {
        if (mounted && val) {
          setTargetNote(val);
        }
      })
      .catch(() => {
        // Fallback to default
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleShortcutBlur = async () => {
    setShortcutError(null);
    try {
      await invoke("set_capture_shortcut", { shortcut });
    } catch (err) {
      const msg =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Invalid shortcut";
      setShortcutError(msg);
    }
  };

  const handleTargetBlur = async () => {
    setTargetError(null);
    try {
      await invoke("set_capture_target", { target: targetNote });
    } catch (err) {
      const msg =
        typeof err === "string"
          ? err
          : err instanceof Error
            ? err.message
            : "Invalid target note";
      setTargetError(msg);
    }
  };

  return (
    <>
      <SettingsRow
        title="Quick capture shortcut"
        description="Global keyboard shortcut to open Quick Capture from anywhere."
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "4px",
          }}
        >
          <Input
            size="sm"
            value={shortcut}
            onChange={(e) => {
              setShortcut(e.target.value);
              if (shortcutError) {
                setShortcutError(null);
              }
            }}
            onBlur={handleShortcutBlur}
            aria-label="Quick capture shortcut"
            variant={shortcutError ? "error" : "default"}
          />
          {shortcutError && (
            <span className={styles["settings-field-error"]} role="alert">
              {shortcutError}
            </span>
          )}
        </div>
      </SettingsRow>

      <SettingsRow
        title="Quick capture target"
        description="Target note where quick capture entries are appended (vault-relative)."
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "4px",
          }}
        >
          <Input
            size="sm"
            value={targetNote}
            onChange={(e) => {
              setTargetNote(e.target.value);
              if (targetError) {
                setTargetError(null);
              }
            }}
            onBlur={handleTargetBlur}
            aria-label="Quick capture target note"
            variant={targetError ? "error" : "default"}
          />
          {targetError && (
            <span className={styles["settings-field-error"]} role="alert">
              {targetError}
            </span>
          )}
        </div>
      </SettingsRow>
    </>
  );
}
