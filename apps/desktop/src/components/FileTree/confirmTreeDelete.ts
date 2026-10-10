import { confirm, message } from "@tauri-apps/plugin-dialog";

type DeleteTreeEntry = () => Promise<boolean | undefined> | undefined;

/** Use Tauri's native dialog because browser modal APIs are unavailable in the webview. */
export async function confirmTreeDelete(
  path: string,
  isFolder: boolean,
  deleteEntry: DeleteTreeEntry,
): Promise<void> {
  const label = isFolder
    ? `folder "${path}" and all its contents`
    : `"${path}"`;
  const confirmed = await confirm(`Delete ${label}? This cannot be undone.`, {
    title: "Delete from vault",
    kind: "warning",
    okLabel: "Delete",
    cancelLabel: "Cancel",
  });
  if (!confirmed) return;

  try {
    if (!(await deleteEntry())) {
      await message(`Could not delete ${label}.`, {
        title: "Delete failed",
        kind: "error",
      });
    }
  } catch (error) {
    await message(error instanceof Error ? error.message : String(error), {
      title: "Delete failed",
      kind: "error",
    });
  }
}
