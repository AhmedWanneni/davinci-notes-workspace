import type Database from "@tauri-apps/plugin-sql";
import { describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  withDbLock: vi.fn(async (work: () => Promise<unknown>) => work()),
  withDbTransaction: vi.fn(async (_db: unknown, work: () => Promise<unknown>) =>
    work(),
  ),
  getSetting: vi.fn(),
  setSetting: vi.fn(),
}));

vi.mock("../vault/sqliteIndex", () => ({
  getVaultIndexDb: vi.fn(),
  withDbLock: database.withDbLock,
  withDbTransaction: database.withDbTransaction,
}));
vi.mock("../vault/settingsCommands", () => ({
  getSetting: database.getSetting,
  setSetting: database.setSetting,
}));

import { loadGitRemoteConfig, saveGitRemoteConfig } from "./GitRemoteConfig";

describe("GitRemoteConfig", () => {
  it("stores only non-sensitive configuration inside the shared DB transaction queue", async () => {
    const db = {} as Database;
    await saveGitRemoteConfig(db, {
      remoteUrl: "https://gitlab.com/example/notes.git",
      username: null,
    });

    expect(database.withDbLock).toHaveBeenCalledOnce();
    expect(database.withDbTransaction).toHaveBeenCalledWith(
      db,
      expect.any(Function),
    );
    expect(database.setSetting).toHaveBeenCalledWith(
      db,
      "git.remote.config",
      JSON.stringify({
        remoteUrl: "https://gitlab.com/example/notes.git",
        username: null,
      }),
    );
  });

  it("loads valid non-sensitive configuration through the same queue", async () => {
    database.getSetting.mockResolvedValueOnce(
      '{"remoteUrl":"https://github.com/example/notes.git","username":"git"}',
    );
    await expect(loadGitRemoteConfig({} as Database)).resolves.toEqual({
      remoteUrl: "https://github.com/example/notes.git",
      username: "git",
    });
    expect(database.withDbLock).toHaveBeenCalled();
  });
});
