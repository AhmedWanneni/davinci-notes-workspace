export function resolveUniqueNotePath(
  existingPaths: readonly string[],
  preferredPath = "Untitled.md",
): string {
  if (!existingPaths.includes(preferredPath)) return preferredPath;

  const extensionIndex = preferredPath.lastIndexOf(".");
  const stem =
    extensionIndex > 0 ? preferredPath.slice(0, extensionIndex) : preferredPath;
  const extension =
    extensionIndex > 0 ? preferredPath.slice(extensionIndex) : "";
  let counter = 1;
  while (existingPaths.includes(`${stem} ${counter}${extension}`)) {
    counter += 1;
  }
  return `${stem} ${counter}${extension}`;
}
