/**
 * Tags and triggers are edited one entry per line, and never as a
 * comma-separated list: a trigger is often a regex that contains a comma, and
 * guessing which comma the user meant would silently corrupt it.
 */
export function listToLines(values: readonly string[]): string {
  return values.join("\n");
}

/** The inverse: blank lines and padding are dropped, so an empty line is not a tag. */
export function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
