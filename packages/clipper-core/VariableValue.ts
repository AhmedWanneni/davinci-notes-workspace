/**
 * The closed value space a template variable or filter may produce.
 *
 * Deliberately narrow: templates are untrusted data, so a resolved value can
 * only ever be a primitive, an array of primitives, or a shallow record — never
 * a function, a DOM node, or an object with a prototype chain we did not build.
 */
export type VariablePrimitive = string | number | boolean;

export type VariableValue =
  | VariablePrimitive
  | VariablePrimitive[]
  | Record<string, unknown>
  | Record<string, unknown>[]
  | undefined
  | null;
