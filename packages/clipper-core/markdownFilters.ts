import { asList, asText } from "./coerceValue.js";
import type { FilterFunction } from "./filterTypes.js";

export const blockquoteFilter: FilterFunction = (value) => {
  const text = asText(value);
  if (text.length === 0) return "";
  return text
    .split("\n")
    .map((line) => (line.length === 0 ? ">" : `> ${line}`))
    .join("\n");
};

export const wikilinkFilter: FilterFunction = (value, args) => {
  const alias = args.length > 0 ? String(args[0]) : undefined;
  const wrap = (target: string): string =>
    alias === undefined || alias.length === 0
      ? `[[${target}]]`
      : `[[${target}|${alias}]]`;
  if (Array.isArray(value)) return value.map((item) => wrap(String(item)));
  return wrap(asText(value));
};

export const imageFilter: FilterFunction = (value, args) => {
  const alt = args.length > 0 ? String(args[0]) : "";
  const source = asText(value);
  if (source.length === 0) return "";
  return `![${alt}](${source})`;
};

export const linkFilter: FilterFunction = (value, args) => {
  const text = args.length > 0 ? asText(args[0]) : asText(value);
  const href = args.length > 1 ? asText(args[1]) : asText(value);
  if (href.length === 0) return "";
  return `[${text}](${href})`;
};

/**
 * `markdown` converts HTML to Markdown. The converter is injected (Defuddle on
 * the extension side) so this package ships no HTML parser and stays pure.
 */
export const markdownFilter: FilterFunction = (value, _args, runtime) => {
  const text = asList(value).join("\n");
  if (text.length === 0) return "";
  if (!runtime.markdown) return text;
  return runtime.markdown(text);
};
