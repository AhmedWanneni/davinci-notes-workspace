import { Button, Toggle } from "@app/design-system";
import {
  DEFAULT_EDITOR_FONT_SIZE,
  isEditorFont,
  MAX_EDITOR_FONT_SIZE,
  MIN_EDITOR_FONT_SIZE,
  validateAndSanitizeCustomFont,
} from "@app/editor";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import { CursorColorSetting } from "./CursorColorSetting";
import { FONT_GROUPS } from "./editorFontGroups";
import styles from "./SettingsDialog.module.scss";

export function EditorSettingsTab() {
  const editorFont = useWorkspaceStore((state) => state.editorFont);
  const editorCustomFont = useWorkspaceStore((state) => state.editorCustomFont);
  const editorFontSize = useWorkspaceStore((state) => state.editorFontSize);
  const setEditorFont = useWorkspaceStore((state) => state.setEditorFont);
  const setEditorCustomFont = useWorkspaceStore(
    (state) => state.setEditorCustomFont,
  );
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
  const vimMonospaceMode = useWorkspaceStore((state) => state.vimMonospaceMode);
  const setVimMonospaceMode = useWorkspaceStore(
    (state) => state.setVimMonospaceMode,
  );
  const slashMenuEnabled = useWorkspaceStore((state) => state.slashMenuEnabled);
  const setSlashMenuEnabled = useWorkspaceStore((state) => state.setSlashMenuEnabled);

  const customValidation = validateAndSanitizeCustomFont(editorCustomFont);

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
            {FONT_GROUPS.map((group) =>
              group.label ? (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ) : (
                group.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              ),
            )}
            {editorFont === "roboto" && <option value="roboto">Roboto</option>}
            {editorFont === "serif" && (
              <option value="serif">Serif (Legacy)</option>
            )}
            {editorFont === "monospace" && (
              <option value="monospace">Monospace (Legacy)</option>
            )}
          </select>
        </SettingsRow>

        {editorFont === "custom" && (
          <SettingsRow
            title="Custom Font Name"
            description="Type the name of a font installed on your system (e.g. Menlo, Fira Code, Georgia)."
          >
            <div className={styles["settings-custom-font-control"]}>
              <input
                type="text"
                value={editorCustomFont}
                aria-label="Custom Font Name"
                placeholder="e.g. Fira Code"
                maxLength={50}
                onChange={(e) => void setEditorCustomFont(e.target.value)}
                className={styles["settings-text-input"]}
              />
              {!customValidation.isValid && editorCustomFont.length > 0 && (
                <span className={styles["settings-field-error"]}>
                  {customValidation.error}
                </span>
              )}
            </div>
          </SettingsRow>
        )}

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
              onClick={() => void setEditorFontSize(DEFAULT_EDITOR_FONT_SIZE)}
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

        <SettingsRow
          title="Slash menu"
          description="Show insert options when typing / at the start of a line or after whitespace."
        >
          <Toggle
            checked={slashMenuEnabled}
            onCheckedChange={(checked) => void setSlashMenuEnabled(checked)}
            aria-label="Slash menu"
          />
        </SettingsRow>

        <SettingsRow
          title="Use monospace font in vim mode"
          description="Maintain uniform cursor width across characters by switching to JetBrains Mono in Vim mode."
        >
          <Toggle
            checked={vimMonospaceMode}
            onCheckedChange={(checked) => void setVimMonospaceMode(checked)}
            aria-label="Use monospace font in vim mode"
          />
        </SettingsRow>

        <CursorColorSetting />
      </SettingsCard>
    </div>
  );
}
