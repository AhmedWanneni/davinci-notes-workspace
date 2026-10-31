import { Directory, File } from "expo-file-system";

export interface FolderAccessCheckResult {
  accessible: boolean;
  error?: string;
  isNonEmpty?: boolean;
}

/**
 * Checks whether a target path or URI is accessible for both reading and writing
 * by DaVinci Notes (Android SAF or filesystem access).
 */
export async function checkFolderAccess(
  pathOrUri: string,
): Promise<FolderAccessCheckResult> {
  const clean = pathOrUri.trim();
  if (!clean) {
    return { accessible: false, error: "Target path cannot be empty" };
  }

  // Syncthing runs as a native background daemon that requires standard
  // POSIX filesystem paths (file://). Android SAF document URIs (content://)
  // cannot be accessed by the Syncthing sync engine.
  if (clean.startsWith("content://")) {
    return {
      accessible: false,
      error:
        "Syncthing requires app sandbox storage. External Document Picker folders (content://) cannot be accessed directly by Syncthing.",
    };
  }

  try {
    const dir = new Directory(clean);
    if (!dir.exists) {
      try {
        dir.create({ intermediates: true, idempotent: true });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          accessible: false,
          error: `Cannot create target directory: ${msg}`,
        };
      }
    }

    // Verify read access
    let entries: string[] = [];
    try {
      entries = dir.list().map((e) => e.name);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        accessible: false,
        error: `Cannot list folder contents: ${msg}`,
      };
    }

    // Check non-empty (ignoring common metadata)
    const significantFiles = entries.filter(
      (name) =>
        name !== ".DS_Store" &&
        name !== ".stfolder" &&
        name !== ".stignore" &&
        name !== "Thumbs.db",
    );
    const isNonEmpty = significantFiles.length > 0;

    // Verify write access with atomic probe (must await async write in Expo SDK 58)
    const probe = new File(dir, ".davinci_access_probe.tmp");
    try {
      await probe.write("probe");
      if (!probe.exists) {
        return {
          accessible: false,
          error:
            "Directory is read-only. DaVinci Notes requires write permission.",
        };
      }
    } catch (writeErr: unknown) {
      const msg =
        writeErr instanceof Error ? writeErr.message : String(writeErr);
      return {
        accessible: false,
        error: `Target directory is not writable: ${msg}`,
      };
    } finally {
      try {
        if (probe.exists) {
          probe.delete();
        }
      } catch {
        // probe cleanup
      }
    }

    return { accessible: true, isNonEmpty };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      accessible: false,
      error: `Folder access check failed: ${msg}`,
    };
  }
}
