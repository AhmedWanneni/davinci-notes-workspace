const DEFAULT_FOLDER_STEM = "New Folder";

/** Unique vault-relative folder path under `parentFolder` (empty = vault root). */
export function resolveUniqueFolderPath(
  parentFolder: string,
  existingFolders: readonly string[],
  stem = DEFAULT_FOLDER_STEM,
): string {
  const prefix = parentFolder ? `${parentFolder}/` : "";
  let candidate = `${prefix}${stem}`;
  if (!existingFolders.includes(candidate)) {
    return candidate;
  }
  let counter = 2;
  while (existingFolders.includes(`${prefix}${stem} ${counter}`)) {
    counter += 1;
  }
  return `${prefix}${stem} ${counter}`;
}

export function folderNameFromPath(folderPath: string): string {
  return folderPath.split("/").pop() ?? folderPath;
}
