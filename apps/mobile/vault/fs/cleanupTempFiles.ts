import { File, Directory } from "expo-file-system";

/**
 * Recovers or cleans up orphaned temporary files from interrupted atomic writes.
 *
 * Crash safety model:
 * 1. An atomic write creates `.<name>.<nonce>.tmp` in the same folder as `<name>`.
 * 2. If the process crashed before `temp.move(target, { overwrite: true })`,
 *    the target file still contains the valid previous content. The temp file
 *    is discarded.
 * 3. If target was somehow missing and only the temp file exists, the temp file
 *    is restored as `<name>`.
 */
export async function cleanupOrphanedTempFiles(
  dir: Directory,
): Promise<{ cleaned: number; restored: number }> {
  let cleaned = 0;
  let restored = 0;

  try {
    if (!dir.exists) return { cleaned, restored };
    const items = dir.list();

    for (const item of items) {
      if (item instanceof Directory) {
        const sub = await cleanupOrphanedTempFiles(item);
        cleaned += sub.cleaned;
        restored += sub.restored;
        continue;
      }

      if (item instanceof File) {
        const name = item.name;
        // Matches `.<basename>.<nonce>.tmp`
        const match = /^\.(.+)\.[a-z0-9]+\.tmp$/i.exec(name);
        if (!match) continue;

        const originalName = match[1];
        const target = new File(dir, originalName);

        try {
          if (target.exists) {
            // Target exists; temp file is an abandoned draft from a killed write
            item.delete();
            cleaned++;
          } else {
            // Target was missing; restore temp file as target
            await item.move(target, { overwrite: true });
            restored++;
          }
        } catch {
          // Best-effort cleanup
        }
      }
    }
  } catch {
    // Non-fatal if directory cannot be listed
  }

  return { cleaned, restored };
}
