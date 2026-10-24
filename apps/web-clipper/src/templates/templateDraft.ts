import type { ClipTemplate, ClipTemplateProperty } from "@app/clipper-core";

/**
 * The pure list and draft transforms behind the template library.
 *
 * They are plain functions rather than inline `useState` updaters so the rules —
 * what a copy is, what a new template starts as, what survives a rename — are
 * testable without React.
 */

export const NEW_TEMPLATE_NAME = "New template";

/** The default clip tag is `clippings`, here and in the starters (plan §4). */
export function freshTemplate(id: string): ClipTemplate {
  return {
    id,
    name: NEW_TEMPLATE_NAME,
    behavior: "create",
    noteNameFormat: "{{title|safe_name}}",
    folder: "Clippings",
    properties: [],
    tags: ["clippings"],
    body: "{{content}}",
    triggers: [],
  };
}

/** A deep-enough copy: the lists are replaced, so a draft never shares an array. */
export function copyTemplate(template: ClipTemplate): ClipTemplate {
  return {
    ...template,
    properties: template.properties.map((property) => ({ ...property })),
    tags: [...template.tags],
    triggers: [...template.triggers],
  };
}

export function appendTemplate(
  templates: readonly ClipTemplate[],
  template: ClipTemplate,
): ClipTemplate[] {
  return [...templates, template];
}

export function replaceTemplate(
  templates: readonly ClipTemplate[],
  template: ClipTemplate,
): ClipTemplate[] {
  return templates.map((candidate) =>
    candidate.id === template.id ? template : candidate,
  );
}

export function removeTemplate(
  templates: readonly ClipTemplate[],
  id: string,
): ClipTemplate[] {
  return templates.filter((candidate) => candidate.id !== id);
}

/** The three property-row edits, as pure transforms of the row list. */
export function withPropertyAt(
  properties: readonly ClipTemplateProperty[],
  index: number,
  changes: Partial<ClipTemplateProperty>,
): ClipTemplateProperty[] {
  return properties.map((property, position) =>
    position === index ? { ...property, ...changes } : property,
  );
}

export function withAddedProperty(
  properties: readonly ClipTemplateProperty[],
): ClipTemplateProperty[] {
  return [...properties, { name: "", value: "" }];
}

export function withoutPropertyAt(
  properties: readonly ClipTemplateProperty[],
  index: number,
): ClipTemplateProperty[] {
  return properties.filter((_property, position) => position !== index);
}
