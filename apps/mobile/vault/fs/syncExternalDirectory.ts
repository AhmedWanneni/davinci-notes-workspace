import * as FileSystem from "expo-file-system/legacy";

/**
 * Copies notes and subdirectories from an external folder (e.g. SAF content:// or external path)
 * into a newly created app sandbox vault directory.
 */
export async function syncExternalDirectoryToSandbox(
  sourceUri: string,
  targetDirUri: string,
): Promise<number> {
  let copiedCount = 0;
  const cleanSource = sourceUri.endsWith("/") ? sourceUri : `${sourceUri}/`;
  const cleanTarget = targetDirUri.endsWith("/")
    ? targetDirUri
    : `${targetDirUri}/`;

  try {
    const entries = await FileSystem.readDirectoryAsync(cleanSource);
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === ".davinci") continue;

      const itemSource = `${cleanSource}${entry}`;
      const itemTarget = `${cleanTarget}${entry}`;

      try {
        const info = await FileSystem.getInfoAsync(itemSource);
        if (info.isDirectory) {
          await FileSystem.makeDirectoryAsync(itemTarget, {
            intermediates: true,
          });
          copiedCount += await syncExternalDirectoryToSandbox(
            itemSource,
            itemTarget,
          );
        } else if (info.exists) {
          const content = await FileSystem.readAsStringAsync(itemSource);
          await FileSystem.writeAsStringAsync(itemTarget, content);
          copiedCount++;
        }
      } catch {
        // Continue with next entry on single-file failure
      }
    }
  } catch {
    // If external root cannot be listed, return count copied so far
  }

  return copiedCount;
}
