import type { ReactNode } from "react";
import { Button, Input, Typography } from "@app/design-system";
import {
  CLIP_BEHAVIORS,
  type ClipBehavior,
  type ClipTemplate,
  type ClipTemplateProperty,
} from "@app/clipper-core";
import { linesToList, listToLines } from "../../templates/listLines";
import { TemplatePropertiesEditor } from "../TemplatePropertiesEditor";
import styles from "./TemplateEditor.module.scss";

/** What each behavior does, in the desktop app's terms (ADR-0177). */
const BEHAVIOR_LABELS: Record<ClipBehavior, string> = {
  create: "Create a new note",
  "append-bottom": "Add to the end of the note",
  "append-top": "Add to the start of the note",
  prepend: "Add to the start of the note (Obsidian's prepend)",
  "daily-append": "Add to the end of today's daily note",
  "daily-prepend": "Add to the start of today's daily note",
};

export interface TemplateEditorProps {
  draft: ClipTemplate;
  errors: readonly string[];
  dirty: boolean;
  saving: boolean;
  onChange(changes: Partial<ClipTemplate>): void;
  onPropertyChange(index: number, changes: Partial<ClipTemplateProperty>): void;
  onAddProperty(): void;
  onRemoveProperty(index: number): void;
  onSave(): void;
  onDiscard(): void;
}

function Field({
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

/** The form for one template. Nothing here reads storage; the panel owns that. */
export function TemplateEditor({
  draft,
  errors,
  dirty,
  saving,
  onChange,
  onPropertyChange,
  onAddProperty,
  onRemoveProperty,
  onSave,
  onDiscard,
}: TemplateEditorProps) {
  return (
    <form
      className={styles["template-editor"]}
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      {errors.length === 0 ? null : (
        <ul className={styles["template-editor__errors"]} role="alert">
          {errors.map((error) => (
            <li key={error}>
              <Typography variant="text" size="xs" color="error">
                {error}
              </Typography>
            </li>
          ))}
        </ul>
      )}

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

      <Field
        id="template-tags"
        label="Tags"
        hint="One per line. They are added to the note's frontmatter."
      >
        <textarea
          id="template-tags"
          className={styles["template-editor__textarea"]}
          rows={2}
          spellCheck={false}
          value={listToLines(draft.tags)}
          onChange={(event) =>
            onChange({ tags: linesToList(event.target.value) })
          }
        />
      </Field>

      <Field
        id="template-triggers"
        label="Apply automatically"
        hint="One per line: a URL prefix, a /regex/, or schema:@Type. The first matching template wins."
      >
        <textarea
          id="template-triggers"
          className={styles["template-editor__textarea"]}
          rows={3}
          spellCheck={false}
          value={listToLines(draft.triggers)}
          onChange={(event) =>
            onChange({ triggers: linesToList(event.target.value) })
          }
        />
      </Field>

      <TemplatePropertiesEditor
        properties={draft.properties}
        onChange={onPropertyChange}
        onAdd={onAddProperty}
        onRemove={onRemoveProperty}
      />

      <Field id="template-body" label="Note body">
        <textarea
          id="template-body"
          className={styles["template-editor__body"]}
          rows={8}
          spellCheck={false}
          value={draft.body}
          onChange={(event) => onChange({ body: event.target.value })}
        />
      </Field>

      <div className={styles["template-editor__actions"]}>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!dirty || saving}
        >
          {saving ? "Saving…" : "Save template"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!dirty || saving}
          onClick={onDiscard}
        >
          Discard changes
        </Button>
      </div>
    </form>
  );
}
