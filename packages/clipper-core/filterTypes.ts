import type { VariableValue } from "./VariableValue.js";

/** A filter argument, as parsed from template text. */
export type FilterArgument = string | number | boolean;

export interface FilterCall {
  name: string;
  args: FilterArgument[];
}

/**
 * Ambient values a filter may need. Injected so `clipper-core` stays pure:
 * `markdown` is supplied by the extension (Defuddle-backed), `now` by the caller.
 */
export interface FilterRuntime {
  now: Date;
  markdown?: (html: string) => string;
}

export type FilterFunction = (
  value: VariableValue,
  args: FilterArgument[],
  runtime: FilterRuntime,
) => VariableValue;

export type FilterRegistry = Record<string, FilterFunction>;
