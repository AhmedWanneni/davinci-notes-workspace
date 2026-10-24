import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";

type RenameTreeEntry = () => Promise<boolean> | undefined;

/** Surface failed native folder/note renames instead of leaving inline editing silently. */
export async function runTreeRename(
  kind: "folder" | "note",
  renameEntry: RenameTreeEntry,
): Promise<boolean> {
  const showAlert = async (msg: string, title?: string) => {
    if (hasPlatformAdapters()) {
      await getPlatformAdapters().dialog.alert(msg, title);
    } else if (typeof window !== "undefined") {
      window.alert(msg);
    }
  };

  try {
    const renamed = await renameEntry();
    if (renamed) return true;
    await showAlert(`Could not rename this ${kind}.`, "Rename failed");
  } catch (error) {
    await showAlert(
      error instanceof Error ? error.message : String(error),
      "Rename failed",
    );
  }
  return false;
}
