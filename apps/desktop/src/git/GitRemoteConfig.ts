import type Database from "@tauri-apps/plugin-sql";
import {
  getVaultIndexDb,
  withDbLock,
  withDbTransaction,
} from "../vault/sqliteIndex";
import { getSetting, setSetting } from "../vault/settingsCommands";

const REMOTE_CONFIG_KEY = "git.remote.config";

export interface GitRemoteConfig {
  remoteUrl: string;
  username: string | null;
}

export async function saveGitRemoteConfig(
  db: Database,
  config: GitRemoteConfig,
): Promise<void> {
  await withDbLock(() =>
    withDbTransaction(db, () =>
      setSetting(db, REMOTE_CONFIG_KEY, JSON.stringify(config)),
    ),
  );
}

export async function loadGitRemoteConfig(
  db: Database,
): Promise<GitRemoteConfig | null> {
  return withDbLock(async () => {
    const raw = await getSetting(db, REMOTE_CONFIG_KEY);
    if (!raw) return null;
    try {
      const config = JSON.parse(raw) as GitRemoteConfig;
      return typeof config.remoteUrl === "string" &&
        (typeof config.username === "string" || config.username === null)
        ? config
        : null;
    } catch {
      return null;
    }
  });
}

export async function saveCurrentVaultGitRemoteConfig(
  config: GitRemoteConfig,
): Promise<void> {
  await saveGitRemoteConfig(await getVaultIndexDb(), config);
}
