import * as FileSystem from "expo-file-system/legacy";
import { normalizeToValidFileUri } from "../../vault/pathUtils";

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

  const validUri = normalizeToValidFileUri(clean);
  const cleanDirUri = validUri.endsWith("/") ? validUri : `${validUri}/`;

  try {
    const info = await FileSystem.getInfoAsync(cleanDirUri);
    if (!info.exists) {
      try {
        await FileSystem.makeDirectoryAsync(cleanDirUri, {
          intermediates: true,
        });
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
      entries = await FileSystem.readDirectoryAsync(cleanDirUri);
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

    // Verify write access with atomic probe
    const probeUri = `${cleanDirUri}.davinci_access_probe.tmp`;
    try {
      await FileSystem.writeAsStringAsync(probeUri, "probe");
      const probeInfo = await FileSystem.getInfoAsync(probeUri);
      if (!probeInfo.exists) {
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
        await FileSystem.deleteAsync(probeUri, { idempotent: true });
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
