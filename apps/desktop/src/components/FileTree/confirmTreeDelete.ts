import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";

type DeleteTreeEntry = () => Promise<boolean | undefined> | undefined;

export async function confirmTreeDelete(
  path: string,
  isFolder: boolean,
  deleteEntry: DeleteTreeEntry,
): Promise<void> {
  const label = isFolder
    ? `folder "${path}" and all its contents`
    : `"${path}"`;

  let confirmed = false;
  if (hasPlatformAdapters()) {
    confirmed = await getPlatformAdapters().dialog.confirm({
      message: `Delete ${label}? This cannot be undone.`,
      title: "Delete from vault",
      okLabel: "Delete",
      cancelLabel: "Cancel",
    });
  } else if (typeof window !== "undefined") {
    confirmed = window.confirm(`Delete ${label}? This cannot be undone.`);
  }

  if (!confirmed) return;

  const showAlert = async (msg: string, title?: string) => {
    if (hasPlatformAdapters()) {
      await getPlatformAdapters().dialog.alert(msg, title);
    } else if (typeof window !== "undefined") {
      window.alert(msg);
    }
  };

  try {
    if (!(await deleteEntry())) {
      await showAlert(`Could not delete ${label}.`, "Delete failed");
    }
  } catch (error) {
    await showAlert(
      error instanceof Error ? error.message : String(error),
      "Delete failed",
    );
  }
}
