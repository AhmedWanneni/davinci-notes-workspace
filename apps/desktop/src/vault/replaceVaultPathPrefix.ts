/** Replace a vault path prefix across note/folder path lists. */
export function replaceVaultPathPrefix(
  paths: readonly string[],
  oldPrefix: string,
  newPrefix: string,
): string[] {
  return paths.map((path) => {
    if (path === oldPrefix) {
      return newPrefix;
    }
    if (path.startsWith(`${oldPrefix}/`)) {
      return `${newPrefix}${path.slice(oldPrefix.length)}`;
    }
    return path;
  });
}
