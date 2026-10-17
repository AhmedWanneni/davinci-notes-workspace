import {
  firstFilter,
  joinFilter,
  lastFilter,
  listFilter,
  sliceFilter,
  splitFilter,
  tableFilter,
} from "./arrayFilters.js";
import { dateFilter } from "./formatDate.js";
import type { FilterRegistry } from "./filterTypes.js";
import {
  blockquoteFilter,
  imageFilter,
  linkFilter,
  markdownFilter,
  wikilinkFilter,
} from "./markdownFilters.js";
import { safeNameFilter } from "./safeName.js";
import {
  capitalizeFilter,
  lowerFilter,
  replaceFilter,
  titleFilter,
  trimFilter,
  upperFilter,
} from "./stringFilters.js";

/**
 * The v1 filter set. Deliberately closed and dependency-free (PERFORMANCE.md:
 * no library for a handful of string operations). Interpreter-bound filters
 * (`map`, `prompt`, …) are intentionally absent.
 */
export const DEFAULT_FILTERS: FilterRegistry = {
  upper: upperFilter,
  lower: lowerFilter,
  trim: trimFilter,
  capitalize: capitalizeFilter,
  title: titleFilter,
  replace: replaceFilter,
  date: dateFilter,
  join: joinFilter,
  split: splitFilter,
  first: firstFilter,
  last: lastFilter,
  slice: sliceFilter,
  list: listFilter,
  table: tableFilter,
  blockquote: blockquoteFilter,
  wikilink: wikilinkFilter,
  image: imageFilter,
  link: linkFilter,
  markdown: markdownFilter,
  safe_name: safeNameFilter,
};

export function createFilterRegistry(
  overrides: FilterRegistry = {},
): FilterRegistry {
  return { ...DEFAULT_FILTERS, ...overrides };
}
