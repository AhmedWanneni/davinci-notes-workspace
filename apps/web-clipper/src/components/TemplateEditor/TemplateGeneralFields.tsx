import type { ReactNode } from "react";
import { Input, Toggle, Typography } from "@app/design-system";
import {
  CLIP_BEHAVIORS,
  type ClipBehavior,
  type ClipTemplate,
} from "@app/clipper-core";
import styles from "./TemplateEditor.module.scss";

const BEHAVIOR_LABELS: Record<ClipBehavior, string> = {
  create: "Create a new note",
  "append-bottom": "Add to the end of the note",
  "append-top": "Add to the start of the note",
  prepend: "Add to the start of the note (Obsidian's prepend)",
  "daily-append": "Add to the end of today's daily note",
  "daily-prepend": "Add to the start of today's daily note",
};

export interface TemplateGeneralFieldsProps {
  draft: ClipTemplate;
  onChange(changes: Partial<ClipTemplate>): void;
}

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles["template-editor__field"]}>
      <label className={styles["template-editor__label"]} htmlFor={id}>
        <Typography variant="text" size="sm" weight="medium">
          {label}
        </Typography>
      </label>
      {children}
      {hint === undefined ? null : (
        <Typography variant="text" size="xs" color="muted">
          {hint}
        </Typography>
      )}
    </div>
  );
}

export function TemplateGeneralFields({
  draft,
  onChange,
}: TemplateGeneralFieldsProps) {
  return (
    <>
      <Field id="template-name" label="Template name">
        <Input
          id="template-name"
          size="sm"
          value={draft.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </Field>

      <Field id="template-behavior" label="When a note already exists">
        <select
          id="template-behavior"
          className={styles["template-editor__select"]}
          value={draft.behavior}
          onChange={(event) =>
            onChange({ behavior: event.target.value as ClipBehavior })
          }
        >
          {CLIP_BEHAVIORS.map((behavior) => (
            <option key={behavior} value={behavior}>
              {BEHAVIOR_LABELS[behavior]}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="template-note-name"
        label="Note name"
        hint="A template: {{title|safe_name}} is the page title, made safe for a file name."
      >
        <Input
          id="template-note-name"
          size="sm"
          value={draft.noteNameFormat}
          onChange={(event) => onChange({ noteNameFormat: event.target.value })}
        />
      </Field>

      <Field
        id="template-folder"
        label="Folder"
        hint="Vault-relative, or empty for the vault root."
      >
        <Input
          id="template-folder"
          size="sm"
          value={draft.folder}
          onChange={(event) => onChange({ folder: event.target.value })}
        />
      </Field>

      <Field
        id="template-vault"
        label="Vault"
        hint="Optional. Empty clips into the vault that is open in DaVinci Notes."
      >
        <Input
          id="template-vault"
          size="sm"
          value={draft.vault ?? ""}
          onChange={(event) =>
            onChange({
              vault:
                event.target.value.trim().length === 0
                  ? undefined
                  : event.target.value,
            })
          }
        />
      </Field>

      <div className={styles["template-editor__toggle-row"]}>
        <div>
          <Typography variant="text" size="sm" weight="medium">
            Save images to vault
          </Typography>
          <Typography variant="text" size="xs" color="muted">
            Download images to the attachments folder for offline reading.
          </Typography>
        </div>
        <Toggle
          id="template-download-images"
          checked={Boolean(draft.downloadImages)}
          onCheckedChange={(checked) => onChange({ downloadImages: checked })}
        />
      </div>
    </>
  );
}
