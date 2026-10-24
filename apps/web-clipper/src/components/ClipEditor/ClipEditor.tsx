import { Input, Typography } from "@app/design-system";
import type { ClipPropertyValue } from "@app/clipper-core";
import styles from "./ClipEditor.module.scss";

export interface ClipEditorProps {
  noteName: string;
  folder: string;
  properties: Readonly<Record<string, ClipPropertyValue>>;
  onNoteNameChange(value: string): void;
  onFolderChange(value: string): void;
  onPropertyChange(name: string, value: string): void;
}

/**
 * The editable part of a clip: where the note goes, and its frontmatter.
 *
 * List-valued properties are shown but not editable — turning an array into a
 * text field would mean the user's comma has to be guessed as a separator, and a
 * silently misinterpreted frontmatter value is worse than one that cannot be
 * edited here.
 */
export function ClipEditor({
  noteName,
  folder,
  properties,
  onNoteNameChange,
  onFolderChange,
  onPropertyChange,
}: ClipEditorProps) {
  const entries = Object.entries(properties);

  return (
    <div className={styles["clip-editor"]}>
      <div className={styles["clip-editor__field"]}>
        <label
          className={styles["clip-editor__label"]}
          htmlFor="clip-note-name"
        >
          <Typography variant="text" size="sm" weight="medium">
            Note name
          </Typography>
        </label>
        <Input
          id="clip-note-name"
          size="sm"
          value={noteName}
          onChange={(event) => onNoteNameChange(event.target.value)}
        />
      </div>

      <div className={styles["clip-editor__field"]}>
        <label className={styles["clip-editor__label"]} htmlFor="clip-folder">
          <Typography variant="text" size="sm" weight="medium">
            Folder
          </Typography>
        </label>
        <Input
          id="clip-folder"
          size="sm"
          value={folder}
          placeholder="Vault root"
          onChange={(event) => onFolderChange(event.target.value)}
        />
      </div>

      {entries.length > 0 ? (
        <fieldset className={styles["clip-editor__properties"]}>
          <legend className={styles["clip-editor__legend"]}>
            <Typography variant="text" size="sm" weight="medium">
              Properties
            </Typography>
          </legend>
          {entries.map(([name, value]) => {
            const list = Array.isArray(value) ? value : undefined;
            // Property names come from templates, so they may hold characters
            // that are awkward in an `id`; the label points at a slug instead.
            const id = `clip-property-${name.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

            return (
              <div className={styles["clip-editor__field"]} key={name}>
                {list === undefined ? (
                  <>
                    <label
                      className={styles["clip-editor__label"]}
                      htmlFor={id}
                    >
                      <Typography variant="text" size="xs" color="muted">
                        {name}
                      </Typography>
                    </label>
                    <Input
                      id={id}
                      size="sm"
                      value={String(value)}
                      onChange={(event) =>
                        onPropertyChange(name, event.target.value)
                      }
                    />
                  </>
                ) : (
                  <>
                    <Typography variant="text" size="xs" color="muted">
                      {name}
                    </Typography>
                    <Typography variant="text" size="xs">
                      {list.join(", ")}
                    </Typography>
                  </>
                )}
              </div>
            );
          })}
        </fieldset>
      ) : null}
    </div>
  );
}
