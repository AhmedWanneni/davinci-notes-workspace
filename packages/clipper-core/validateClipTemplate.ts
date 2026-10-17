import { CLIP_BEHAVIORS, type ClipBehavior } from "./ClipPayload.js";
import type { ClipTemplate, ClipTemplateProperty } from "./ClipTemplate.js";
import { isReservedPropertyName } from "./propertyName.js";
import { triggerRuleError } from "./triggerRule.js";

export interface ClipTemplateValidation {
  ok: boolean;
  errors: string[];
  template?: ClipTemplate;
}

/**
 * Validate an imported template before it is ever rendered.
 *
 * A template is JSON from disk (or another machine), so it is hostile input:
 * reject unknown shapes instead of coercing, and never accept extra keys that a
 * later version might interpret.
 */
export function validateClipTemplate(input: unknown): ClipTemplateValidation {
  const errors: string[] = [];

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: ["template must be an object"] };
  }
  const record = input as Record<string, unknown>;

  const id = readString(record.id, "id", errors, true);
  const name = readString(record.name, "name", errors, true);
  const noteNameFormat = readString(
    record.noteNameFormat,
    "noteNameFormat",
    errors,
    true,
  );
  const folder = readString(record.folder, "folder", errors, false) ?? "";
  const body = readString(record.body, "body", errors, false) ?? "";
  const behavior = readBehavior(record.behavior, errors);

  const properties = readProperties(record.properties, errors);
  const tags = readStringArray(record.tags, "tags", errors);
  const triggers = readStringArray(record.triggers, "triggers", errors);
  triggers.forEach((trigger, index) => {
    const reason = triggerRuleError(trigger);
    if (reason !== undefined) errors.push(`triggers[${index}] ${reason}`);
  });

  if (
    record.downloadImages !== undefined &&
    typeof record.downloadImages !== "boolean"
  ) {
    errors.push("downloadImages must be a boolean");
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    errors: [],
    template: {
      id: id as string,
      name: name as string,
      behavior: behavior as ClipBehavior,
      noteNameFormat: noteNameFormat as string,
      folder,
      vault: typeof record.vault === "string" ? record.vault : undefined,
      properties,
      tags,
      body,
      triggers,
      downloadImages:
        typeof record.downloadImages === "boolean"
          ? record.downloadImages
          : undefined,
    },
  };
}

function readString(
  value: unknown,
  field: string,
  errors: string[],
  required: boolean,
): string | undefined {
  if (value === undefined) {
    if (required) errors.push(`${field} is required`);
    return undefined;
  }
  if (typeof value !== "string") {
    errors.push(`${field} must be a string`);
    return undefined;
  }
  if (required && value.trim().length === 0) {
    errors.push(`${field} must not be empty`);
    return undefined;
  }
  return value;
}

function readStringArray(
  value: unknown,
  field: string,
  errors: string[],
): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    errors.push(`${field} must be an array of strings`);
    return [];
  }
  return value as string[];
}

function readBehavior(
  value: unknown,
  errors: string[],
): ClipBehavior | undefined {
  if (typeof value !== "string") {
    errors.push("behavior is required");
    return undefined;
  }
  if (!CLIP_BEHAVIORS.includes(value as ClipBehavior)) {
    errors.push(`behavior must be one of: ${CLIP_BEHAVIORS.join(", ")}`);
    return undefined;
  }
  return value as ClipBehavior;
}

function readProperties(
  value: unknown,
  errors: string[],
): ClipTemplateProperty[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    errors.push("properties must be an array");
    return [];
  }
  const properties: ClipTemplateProperty[] = [];
  value.forEach((entry, index) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      errors.push(`properties[${index}] must be an object`);
      return;
    }
    const record = entry as Record<string, unknown>;
    const propertyErrors: string[] = [];
    const name = readString(
      record.name,
      `properties[${index}].name`,
      propertyErrors,
      true,
    );
    const propertyValue = readString(
      record.value,
      `properties[${index}].value`,
      propertyErrors,
      false,
    );
    errors.push(...propertyErrors);
    if (name !== undefined) {
      if (isReservedPropertyName(name)) {
        errors.push(`properties[${index}].name must not be "${name}"`);
      } else {
        properties.push({ name, value: propertyValue ?? "" });
      }
    }
  });
  return properties;
}
