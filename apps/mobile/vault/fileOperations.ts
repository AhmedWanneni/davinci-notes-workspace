import type { MobileVaultStorageAdapter } from "./MobileVaultStorageAdapter";
import { defaultVaultIndexer } from "../indexer";

export interface MoveNoteResult {
  oldPath: string;
  newPath: string;
  hadCollision: boolean;
}

/**
 * Moves a note to a destination folder, automatically resolving filename
 * collisions by appending numeric suffix (e.g., `Note (1).md`) and updating the index.
 */
export async function moveNoteWithCollisionHandling(
  adapter: MobileVaultStorageAdapter,
  sourcePath: string,
  destinationFolder: string,
): Promise<MoveNoteResult> {
  const filename = sourcePath.split("/").pop() ?? sourcePath;
  const stem = filename.replace(/\.md$/i, "");
  const normalizedDest = destinationFolder.replace(/\/+$/, "");

  let targetPath = normalizedDest ? `${normalizedDest}/${filename}` : filename;
  let hadCollision = false;

  let counter = 1;
  let stat = await adapter.statFile(targetPath);
  while (stat.exists) {
    hadCollision = true;
    const suffixedName = `${stem} (${counter}).md`;
    targetPath = normalizedDest
      ? `${normalizedDest}/${suffixedName}`
      : suffixedName;
    counter++;
    stat = await adapter.statFile(targetPath);
  }

  // Execute move on filesystem
  await adapter.renameNote(sourcePath, targetPath);

  // Update SQLite index
  await defaultVaultIndexer.indexVault(adapter, false);

  return { oldPath: sourcePath, newPath: targetPath, hadCollision };
}

/**
 * Deletes a note from the filesystem and removes it from the SQLite index.
 */
export async function deleteNoteAndReindex(
  adapter: MobileVaultStorageAdapter,
  path: string,
): Promise<void> {
  await adapter.deleteNote(path);
  await defaultVaultIndexer.indexVault(adapter, false);
}
