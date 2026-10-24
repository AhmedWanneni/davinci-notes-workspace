import {
  getPlatformAdapters,
  hasPlatformAdapters,
} from "@app/platform-adapters";

/** Non-blocking folder picker via platform dialog adapter. */
export async function pickVaultFolder(): Promise<string | null> {
  if (!hasPlatformAdapters()) {
    return null;
  }

  const picked = await getPlatformAdapters().dialog.pickVaultFolder();
  return picked ? picked.path : null;
}
