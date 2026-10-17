import { Button, Typography } from "@app/design-system";
import type { ClipTemplate, ClipTemplateProperty } from "@app/clipper-core";
import { linesToList, listToLines } from "../../templates/listLines";
import { TemplatePropertiesEditor } from "../TemplatePropertiesEditor";
import { Field, TemplateGeneralFields } from "./TemplateGeneralFields";
import styles from "./TemplateEditor.module.scss";

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

      <TemplateGeneralFields draft={draft} onChange={onChange} />

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
