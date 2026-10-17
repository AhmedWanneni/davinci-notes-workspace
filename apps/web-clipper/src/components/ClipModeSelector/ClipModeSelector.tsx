import { RadioGroup, RadioGroupItem, Typography } from "@app/design-system";
import type { ClipMode } from "@app/clipper-core";
import styles from "./ClipModeSelector.module.scss";

export interface ClipModeOption {
  value: ClipMode;
  label: string;
  hint: string;
}

export const CLIP_MODE_OPTIONS: readonly ClipModeOption[] = [
  { value: "full", label: "Full page", hint: "The extracted article" },
  {
    value: "selection",
    label: "Selection",
    hint: "Only the text you selected",
  },
  {
    value: "highlights",
    label: "Highlights",
    hint: "Only highlighted passages",
  },
];

export interface ClipModeSelectorProps {
  mode: ClipMode;
  onChange: (mode: ClipMode) => void;
  /**
   * Modes with nothing to clip on this page. They stay visible but disabled, so
   * the reason a mode is missing is legible rather than the option vanishing.
   */
  disabledModes?: readonly ClipMode[];
}

export function ClipModeSelector({
  mode,
  onChange,
  disabledModes = [],
}: ClipModeSelectorProps) {
  return (
    <RadioGroup
      className={styles["mode-selector"]}
      value={mode}
      onValueChange={(value) => onChange(value as ClipMode)}
      aria-label="What to clip"
    >
      {CLIP_MODE_OPTIONS.map((option) => {
        const disabled = disabledModes.includes(option.value);
        const id = `clip-mode-${option.value}`;
        return (
          <div
            key={option.value}
            className={styles["mode-selector__option"]}
            data-disabled={disabled ? "true" : undefined}
          >
            <RadioGroupItem value={option.value} id={id} disabled={disabled} />
            <label className={styles["mode-selector__label"]} htmlFor={id}>
              <Typography variant="text" size="sm" weight="medium">
                {option.label}
              </Typography>
              <Typography variant="text" size="xs" color="muted">
                {disabled ? "Nothing to clip" : option.hint}
              </Typography>
            </label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
