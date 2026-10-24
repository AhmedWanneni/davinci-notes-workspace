/**
 * Frontmatter property names come from an imported template, which is hostile
 * input. `__proto__` and friends are never written: assigning them either
 * silently mutates a prototype or disappears from `Object.entries`, so the
 * mismatch would be invisible in the note.
 */
const RESERVED_PROPERTY_NAMES = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

export function isReservedPropertyName(name: string): boolean {
  return RESERVED_PROPERTY_NAMES.has(name);
}
