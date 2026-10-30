import type { ManifestStorage } from "@app/sync-client";
import { getVaultIndexDb, withDbLock } from "../vault/sqliteIndex";
import { getSetting, setSetting } from "../vault/settingsCommands";

const MANIFEST_KEY = "sync.manifest";

export class DesktopManifestStorage implements ManifestStorage {
  async read(): Promise<string | undefined> {
    try {
      const db = await getVaultIndexDb();
      const val = await withDbLock(() => getSetting(db, MANIFEST_KEY));
      return val ?? undefined;
    } catch {
      return undefined;
    }
  }

  async write(value: string): Promise<void> {
    try {
      const db = await getVaultIndexDb();
      await withDbLock(() => setSetting(db, MANIFEST_KEY, value));
    } catch (err) {
      console.warn("[desktop-manifest] Failed to save manifest:", err);
    }
  }
}
