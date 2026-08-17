export function resolveUniqueNotePath(existingPaths: readonly string[]): string {
  const stem = "Untitled";
  let candidate = `${stem}.md`;
  if (!existingPaths.includes(candidate)) return candidate;
  let counter = 1;
  while (existingPaths.includes(`${stem} ${counter}.md`)) {
    counter += 1;
  }
  return `${stem} ${counter}.md`;
}
