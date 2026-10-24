import { asRegExp, asText } from "./coerceValue.js";
import type { FilterFunction } from "./filterTypes.js";

/** Case and whitespace filters. No locale-dependent casing: output must be deterministic. */
export const upperFilter: FilterFunction = (value) =>
  asText(value).toUpperCase();

export const lowerFilter: FilterFunction = (value) =>
  asText(value).toLowerCase();

export const trimFilter: FilterFunction = (value) => asText(value).trim();

export const capitalizeFilter: FilterFunction = (value) => {
  const text = asText(value);
  if (text.length === 0) return text;
  return text[0].toUpperCase() + text.slice(1).toLowerCase();
};

export const titleFilter: FilterFunction = (value) =>
  asText(value).replace(/\S+/g, (word) => {
    if (word.length === 0) return word;
    return word[0].toUpperCase() + word.slice(1).toLowerCase();
  });

export const replaceFilter: FilterFunction = (value, args) => {
  const text = asText(value);
  const search = String(args[0] ?? "");
  const replacement = String(args[1] ?? "");
  if (search.length === 0) return text;

  const pattern = asRegExp(search);
  if (!pattern) return text.split(search).join(replacement);

  const global = pattern.flags.includes("g")
    ? pattern
    : new RegExp(pattern.source, `${pattern.flags}g`);
  return text.replace(global, replacement);
};
