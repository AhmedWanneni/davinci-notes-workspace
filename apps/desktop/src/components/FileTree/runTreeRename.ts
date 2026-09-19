import { message } from "@tauri-apps/plugin-dialog";

type RenameTreeEntry = () => Promise<boolean> | undefined;

/** Surface failed native folder/note renames instead of leaving inline editing silently. */
export async function runTreeRename(
  kind: "folder" | "note",
  renameEntry: RenameTreeEntry,
): Promise<boolean> {
  try {
    const renamed = await renameEntry();
    if (renamed) return true;
    await message(`Could not rename this ${kind}.`, {
      title: "Rename failed",
      kind: "error",
    });
  } catch (error) {
    await message(error instanceof Error ? error.message : String(error), {
      title: "Rename failed",
      kind: "error",
    });
  }
  return false;
}
