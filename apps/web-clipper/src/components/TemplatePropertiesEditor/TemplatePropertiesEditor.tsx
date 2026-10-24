import { Button, Input, Typography } from "@app/design-system";
import type { ClipTemplateProperty } from "@app/clipper-core";
import styles from "./TemplatePropertiesEditor.module.scss";

export interface TemplatePropertiesEditorProps {
  properties: readonly ClipTemplateProperty[];
  onChange(index: number, changes: Partial<ClipTemplateProperty>): void;
  onAdd(): void;
  onRemove(index: number): void;
}

/**
 * The frontmatter a template writes, as name/value rows.
 *
 * Row order is the property order, and nothing is sorted: a user who puts
 * `created` first expects it first.
 */
export function TemplatePropertiesEditor({
  properties,
  onChange,
  onAdd,
  onRemove,
}: TemplatePropertiesEditorProps) {
  return (
    <fieldset className={styles["template-properties"]}>
      <legend className={styles["template-properties__legend"]}>
        <Typography variant="text" size="sm" weight="medium">
          Frontmatter properties
        </Typography>
      </legend>

      {properties.length === 0 ? (
        <Typography variant="text" size="xs" color="muted">
          No properties. The note gets the frontmatter the app always writes.
        </Typography>
      ) : null}

      {properties.map((property, index) => (
        <div className={styles["template-properties__row"]} key={index}>
          <Input
            size="sm"
            aria-label={`Property ${index + 1} name`}
            placeholder="author"
            value={property.name}
            onChange={(event) => onChange(index, { name: event.target.value })}
          />
          <Input
            size="sm"
            aria-label={`Property ${index + 1} value`}
            placeholder="{{author}}"
            value={property.value}
            onChange={(event) => onChange(index, { value: event.target.value })}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onRemove(index)}
          >
            Remove
          </Button>
        </div>
      ))}

      <div>
        <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
          Add property
        </Button>
      </div>
    </fieldset>
  );
}
