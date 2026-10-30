export interface UpdateInfo {
  version: string;
  currentVersion: string;
  body?: string;
  date?: string;
}

export type UpdateCheckResult =
  | { status: "available"; info: UpdateInfo }
  | { status: "up-to-date"; currentVersion: string }
  | { status: "unavailable" }
  | { status: "error"; message: string };

let pendingUpdate: any = null;

function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);
}

export async function checkAppUpdate(): Promise<UpdateCheckResult> {
  if (!isTauriEnvironment()) {
    return { status: "unavailable" };
  }

  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();

    if (!update) {
      return { status: "up-to-date", currentVersion: "0.1.0" };
    }

    pendingUpdate = update;
    return {
      status: "available",
      info: {
        version: update.version,
        currentVersion: update.currentVersion,
        body: update.body,
        date: update.date,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "error", message };
  }
}

export async function downloadAndInstall(
  onProgress?: (downloaded: number, total: number | null) => void
): Promise<{ success: boolean; error?: string }> {
  if (!pendingUpdate) {
    return { success: false, error: "No pending update to download." };
  }

  try {
    let downloaded = 0;
    let total: number | null = null;

    await pendingUpdate.downloadAndInstall((event: any) => {
      if (event.event === "Started") {
        total = event.data?.contentLength ?? null;
      } else if (event.event === "Progress") {
        downloaded += event.data?.chunkLength ?? 0;
        if (onProgress) onProgress(downloaded, total);
      } else if (event.event === "Finished") {
        if (onProgress) onProgress(downloaded, total);
      }
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function restartApp(): Promise<void> {
  if (!isTauriEnvironment()) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("plugin:updater|restart");
  } catch {
    window.location.reload();
  }
}
