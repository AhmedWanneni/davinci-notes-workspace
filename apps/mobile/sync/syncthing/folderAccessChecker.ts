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

  try {
    const dir = new Directory(clean);
    if (!dir.exists) {
      try {
        dir.create({ intermediates: true });
      } catch {
        return {
          accessible: false,
          error:
            "Cannot create target directory: permission denied. Select a folder using Document Picker or grant storage access.",
        };
      }
    }

    // Verify read access
    let entries: string[] = [];
    try {
      entries = dir.list().map((e) => e.name);
    } catch {
      return {
        accessible: false,
        error:
          "Cannot list folder contents. DaVinci Notes cannot read this path (SAF grant required).",
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
    const probe = new File(dir, ".davinci_access_probe.tmp");
    try {
      probe.write("probe");
      if (!probe.exists) {
        return {
          accessible: false,
          error: "Directory is read-only. DaVinci Notes requires write permission.",
        };
      }
      probe.delete();
    } catch {
      return {
        accessible: false,
        error:
          "Target directory is not writable by DaVinci Notes. Re-pick using SAF or choose an accessible folder.",
      };
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
