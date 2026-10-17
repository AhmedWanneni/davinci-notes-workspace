export function resolveUniqueCanvasPath(
  existingPaths: readonly string[],
): string {
  const stem = "Untitled";
  const candidate = `${stem}.canvas`;
  if (!existingPaths.includes(candidate)) return candidate;
  let counter = 1;
  while (existingPaths.includes(`${stem} ${counter}.canvas`)) {
    counter += 1;
  }
  return `${stem} ${counter}.canvas`;
}
