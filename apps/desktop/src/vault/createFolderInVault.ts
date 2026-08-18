import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { resolveUniqueFolderPath } from "./resolveUniqueFolderPath";
import { createFolder } from "./vaultCommands";
import { withVaultWatchSuppressed } from "./vaultWatchSession";

/** Create an empty vault folder on disk and refresh `allFolderPaths`. */
export async function createFolderInVault(
  parentFolder = "",
): Promise<string> {
  return withVaultWatchSuppressed(async () => {
    const parent = parentFolder.trim().replace(/\/+$/, "");
    const folderPath = resolveUniqueFolderPath(
      parent,
      useWorkspaceStore.getState().allFolderPaths,
    );
    await createFolder(folderPath);
    const updated = [
      ...useWorkspaceStore.getState().allFolderPaths,
      folderPath,
    ].sort();
    useWorkspaceStore.getState().updateAllFolderPaths(updated);
    return folderPath;
  });
}
