import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SettingsRow } from "./SettingsRow";
import styles from "./SettingsDialog.module.scss";

interface TrayClickResponse {
  action: "capture" | "menu";
  supported: boolean;
}

export function TrayClickSettingsRow() {
  const [action, setAction] = useState<"capture" | "menu">("capture");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    let mounted = true;
    void invoke<TrayClickResponse>("get_tray_click_action")
      .then((res) => {
        if (mounted && res) {
          setAction(res.action === "menu" ? "menu" : "capture");
          setSupported(res.supported);
        }
      })
      .catch(() => {
        // Fallback default outside Tauri or if unavailable
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!supported) {
    return null;
  }

  const handleChange = (newAction: "capture" | "menu") => {
    setAction(newAction);
    void invoke("set_tray_click_action", { action: newAction }).catch((err) => {
      console.error("Failed to update tray click action", err);
    });
  };

  return (
    <SettingsRow
      title="Menu bar icon click"
      description="Action performed when clicking the menu bar icon. Right-click always opens the menu."
    >
      <select
        value={action}
        onChange={(e) => handleChange(e.target.value as "capture" | "menu")}
        className={styles["settings-select"]}
        aria-label="Menu bar icon click action"
      >
        <option value="capture">Open quick capture</option>
        <option value="menu">Open menu</option>
      </select>
    </SettingsRow>
  );
}
