import { renameNoteInVault, RenameNoteResult } from "./renameNoteInVault";

/**
 * Move a note to a different folder.
 * This is a thin wrapper around renameNoteInVault since the underlying
 * implementation handles path changes as moves.
 */
export async function moveNoteInVault(
  oldPath: string,
  newParentFolder: string,
): Promise<RenameNoteResult> {
  const filename = oldPath.includes("/")
    ? oldPath.slice(oldPath.lastIndexOf("/") + 1)
    : oldPath;

  const newPath = newParentFolder
    ? `${newParentFolder}/${filename}`
    : filename;

  return renameNoteInVault(oldPath, newPath);
}
