import { Button, Toggle } from "@app/design-system";
import {
  editorFonts,
  isEditorFont,
  MAX_EDITOR_FONT_SIZE,
  MIN_EDITOR_FONT_SIZE,
} from "@app/editor";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import styles from "./SettingsDialog.module.scss";

export function EditorSettingsTab() {
  const editorFont = useWorkspaceStore((state) => state.editorFont);
  const editorFontSize = useWorkspaceStore((state) => state.editorFontSize);
  const setEditorFont = useWorkspaceStore((state) => state.setEditorFont);
  const previewEditorFontSize = useWorkspaceStore(
    (state) => state.previewEditorFontSize,
  );
  const setEditorFontSize = useWorkspaceStore(
    (state) => state.setEditorFontSize,
  );
  const strictLineBreaks = useWorkspaceStore((state) => state.strictLineBreaks);
  const setStrictLineBreaks = useWorkspaceStore(
    (state) => state.setStrictLineBreaks,
  );
  const useVimMode = useWorkspaceStore((state) => state.useVimMode);
  const setUseVimMode = useWorkspaceStore((state) => state.setUseVimMode);

  return (
    <div className={styles["settings-tab-content"]}>
      <SettingsCard title="Typography">
        <SettingsRow
          title="Editor Font"
          description="Choose the font family used for the markdown editor."
        >
          <select
            value={editorFont}
            onChange={(e) => {
              if (isEditorFont(e.target.value)) {
                void setEditorFont(e.target.value);
              }
            }}
            className={styles["settings-select"]}
            aria-label="Editor Font"
          >
            {editorFonts.map((font) => (
              <option key={font} value={font}>
                {font === "system"
                  ? "System UI"
                  : font[0].toUpperCase() + font.slice(1)}
              </option>
            ))}
          </select>
        </SettingsRow>

        <SettingsRow
          title="Editor Font Size"
          description={`Scale the editor text size in pixels (${MIN_EDITOR_FONT_SIZE}–${MAX_EDITOR_FONT_SIZE}px).`}
        >
          <div className={styles["settings-range-control"]}>
            <input
              type="range"
              min={MIN_EDITOR_FONT_SIZE}
              max={MAX_EDITOR_FONT_SIZE}
              step="1"
              value={editorFontSize}
              aria-label="Editor font size slider"
              onChange={(event) =>
                previewEditorFontSize(Number(event.target.value))
              }
              onPointerUp={() => void setEditorFontSize(editorFontSize)}
              onKeyUp={() => void setEditorFontSize(editorFontSize)}
              className={styles["settings-slider"]}
            />
            <input
              type="number"
              min={MIN_EDITOR_FONT_SIZE}
              max={MAX_EDITOR_FONT_SIZE}
              step="1"
              value={editorFontSize}
              aria-label="Editor font size in pixels"
              onChange={(event) =>
                previewEditorFontSize(Number(event.target.value))
              }
              onBlur={() => void setEditorFontSize(editorFontSize)}
              className={styles["settings-number-input"]}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void setEditorFontSize(16)}
            >
              Reset
            </Button>
          </div>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard title="Behavior">
        <SettingsRow
          title="Strict Line Breaks"
          description="Merge soft paragraph lines; use two trailing spaces or Shift+Enter for a hard line break."
        >
          <Toggle
            checked={strictLineBreaks}
            onCheckedChange={(checked) => void setStrictLineBreaks(checked)}
            aria-label="Strict Line Breaks"
          />
        </SettingsRow>

        <SettingsRow
          title="Vim Keybindings"
          description="Enable modal Vim keybindings for document navigation and text editing."
        >
          <Toggle
            checked={useVimMode}
            onCheckedChange={(checked) => void setUseVimMode(checked)}
            aria-label="Vim Keybindings"
          />
        </SettingsRow>
      </SettingsCard>
    </div>
  );
}
