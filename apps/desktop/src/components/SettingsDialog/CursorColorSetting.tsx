import { useState } from "react";
import {
  CURSOR_COLOR_PRESETS,
  DEFAULT_CURSOR_COLOR,
  loadSavedCursorColor,
  saveCursorColor,
  applyCursorColor,
} from "../../themes";
import { SettingsRow } from "./SettingsRow";
import styles from "./SettingsDialog.module.scss";

export function CursorColorSetting() {
  const [currentCursor, setCurrentCursor] = useState<string>(() => {
    return loadSavedCursorColor() ?? DEFAULT_CURSOR_COLOR;
  });

  const handleSelectCursor = (color: string) => {
    setCurrentCursor(color);
    saveCursorColor(color);
    applyCursorColor(color);
  };

  const handleResetCursor = () => {
    setCurrentCursor(DEFAULT_CURSOR_COLOR);
    saveCursorColor(DEFAULT_CURSOR_COLOR);
    applyCursorColor(DEFAULT_CURSOR_COLOR);
  };

  return (
    <SettingsRow
      title="Cursor Color"
      description="Choose a cursor color for editing notes and Vim mode, or use the default."
    >
      <div
        className={styles["accent-picker"]}
        role="group"
        aria-label="Cursor Color Picker"
      >
        {CURSOR_COLOR_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={styles["accent-swatch"]}
            style={{
              backgroundColor:
                preset.value === "default"
                  ? "var(--color-text-normal)"
                  : preset.value,
            }}
            data-selected={
              currentCursor.toLowerCase() === preset.value.toLowerCase() ||
              undefined
            }
            onClick={() => handleSelectCursor(preset.value)}
            aria-label={`Cursor ${preset.label}`}
            title={preset.label}
          />
        ))}
        <input
          type="color"
          className={styles["accent-color-input"]}
          value={currentCursor.startsWith("#") ? currentCursor : "#000000"}
          onChange={(e) => handleSelectCursor(e.target.value)}
          aria-label="Custom cursor color"
          title="Custom cursor color"
        />
        {currentCursor !== DEFAULT_CURSOR_COLOR && (
          <button
            type="button"
            className={styles["accent-reset-btn"]}
            onClick={handleResetCursor}
          >
            Reset
          </button>
        )}
      </div>
    </SettingsRow>
  );
}
