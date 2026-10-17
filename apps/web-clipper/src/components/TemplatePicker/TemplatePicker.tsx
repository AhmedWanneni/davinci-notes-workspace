import { Badge, Typography } from "@app/design-system";
import type { ClipTemplate } from "@app/clipper-core";
import styles from "./TemplatePicker.module.scss";

export interface TemplatePickerProps {
  templates: readonly ClipTemplate[];
  selectedId: string;
  onSelect: (id: string) => void;
  /**
   * The template that would be chosen automatically for this page, if any. Used
   * only to explain the current choice — selecting a different one wins.
   */
  matchedId?: string;
}

export function TemplatePicker({
  templates,
  selectedId,
  onSelect,
  matchedId,
}: TemplatePickerProps) {
  const isAutomatic = matchedId !== undefined && matchedId === selectedId;

  return (
    <div className={styles["template-picker"]}>
      <label
        className={styles["template-picker__label"]}
        htmlFor="clip-template"
      >
        <Typography variant="text" size="sm" weight="medium">
          Template
        </Typography>
      </label>
      <div className={styles["template-picker__row"]}>
        <select
          id="clip-template"
          className={styles["template-picker__select"]}
          value={selectedId}
          onChange={(event) => onSelect(event.target.value)}
        >
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        {isAutomatic ? <Badge variant="accent">Matched</Badge> : null}
      </div>
      <Typography variant="text" size="xs" color="muted">
        {isAutomatic
          ? "Chosen automatically for this page."
          : matchedId === undefined
            ? "No template rule matches this page."
            : "You chose this; the matching template is still available."}
      </Typography>
    </div>
  );
}
