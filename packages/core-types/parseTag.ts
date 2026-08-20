import type { TagMatch } from "./Tag";

const allowedTagCharacter = /[\p{L}\p{N}\p{M}\p{S}_/\-\u200d]/u;
const numericCharacter = /^\p{N}$/u;

function isAllowedTagCharacter(character: string): boolean {
  return allowedTagCharacter.test(character);
}

function hasNonNumericCharacter(value: string): boolean {
  return [...value].some((character) => !numericCharacter.test(character));
}

function isValidTagBodyValue(value: string): boolean {
  if (value.length === 0) return false;
  if (value.split("/").some((segment) => segment.length === 0)) return false;
  if (![...value].every(isAllowedTagCharacter)) return false;
  return hasNonNumericCharacter(value);
}

/** Returns whether a complete string is a valid tag spelling. */
export function isValidTag(value: string): boolean {
  if (!value.startsWith("#") || value.length < 2) return false;
  return isValidTagBodyValue(value.slice(1));
}

/** Returns whether a tag body spelling is valid without a leading `#`. */
export function isValidTagBody(value: string): boolean {
  if (value.startsWith("#")) return false;
  return isValidTagBodyValue(value);
}

/** Normalizes a tag identity without changing its display spelling. */
export function normalizeTag(value: string): string {
  if (!isValidTag(value)) throw new Error(`Invalid tag: ${value}`);
  return value.slice(1).toLocaleLowerCase("und");
}

/** Normalizes a tag body identity without changing its display spelling. */
export function normalizeTagBody(value: string): string {
  if (!isValidTagBody(value)) throw new Error(`Invalid tag body: ${value}`);
  return value.toLocaleLowerCase("und");
}

/** Extracts valid tag prefixes from plain text. */
export function matchTags(text: string): TagMatch[] {
  const matches: TagMatch[] = [];
  const characters = [...text.matchAll(/./gu)];
  for (let index = 0; index < characters.length; index++) {
    const character = characters[index][0];
    if (character !== "#") continue;
    const start = characters[index].index!;
    const previous = index === 0 ? "" : characters[index - 1][0];
    if (previous === "#" || (previous && isAllowedTagCharacter(previous))) {
      continue;
    }

    let endIndex = index + 1;
    while (
      endIndex < characters.length &&
      isAllowedTagCharacter(characters[endIndex][0])
    ) {
      endIndex++;
    }
    const end = endIndex < characters.length
      ? characters[endIndex].index!
      : text.length;
    const raw = text.slice(start, end);
    if (isValidTag(raw)) {
      matches.push({ raw, tag: raw, start, end });
    }
    index = endIndex - 1;
  }
  return matches;
}

/** Expands `#a/b/c` into its inclusive ancestor chain. */
export function decomposeTag(value: string): string[] {
  if (!isValidTag(value)) throw new Error(`Invalid tag: ${value}`);
  const segments = value.slice(1).split("/");
  if (segments.some((segment) => segment.length === 0)) {
    throw new Error(`Invalid nested tag: ${value}`);
  }
  return segments.map((_, index) => `#${segments.slice(0, index + 1).join("/")}`);
}
