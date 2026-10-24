import { getVaultIndexDb, withDbLock } from "../database";

export type ThemeMode = "system" | "light" | "dark";

export interface PersistedThemeState {
  activeThemeId: string;
  themeMode: ThemeMode;
}

const DEFAULT_STATE: PersistedThemeState = {
  activeThemeId: "dark-b",
  themeMode: "system",
};

let inMemoryThemeState: PersistedThemeState = { ...DEFAULT_STATE };
let isInitialized = false;

export function isThemeInitialized(): boolean {
  return isInitialized;
}

export function getCachedThemeState(): PersistedThemeState {
  return inMemoryThemeState;
}

export const loadThemeStateToCache = loadThemeStateFromDb;

export async function loadThemeStateFromDb(): Promise<PersistedThemeState> {
  try {
    const db = await getVaultIndexDb();
    const rows = await withDbLock(() =>
      db.getAllAsync<{ key: string; value: string }>(
        "SELECT key, value FROM settings WHERE key IN ('theme.active_id', 'theme.mode')",
      ),
    );

    let activeThemeId = DEFAULT_STATE.activeThemeId;
    let themeMode = DEFAULT_STATE.themeMode;

    for (const row of rows) {
      if (row.key === "theme.active_id" && row.value) {
        activeThemeId = row.value;
      } else if (
        row.key === "theme.mode" &&
        (row.value === "system" ||
          row.value === "light" ||
          row.value === "dark")
      ) {
        themeMode = row.value;
      }
    }

    inMemoryThemeState = { activeThemeId, themeMode };
    isInitialized = true;
    return inMemoryThemeState;
  } catch (err) {
    console.warn(
      "[themePersistence] Failed to load theme settings from DB:",
      err,
    );
    return inMemoryThemeState;
  }
}

export async function saveThemeStateToDb(
  activeThemeId: string,
  themeMode: ThemeMode,
): Promise<void> {
  inMemoryThemeState = { activeThemeId, themeMode };

  try {
    const db = await getVaultIndexDb();
    await withDbLock(async () => {
      await db.runAsync(
        "INSERT INTO settings (key, value) VALUES ('theme.active_id', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        activeThemeId,
      );
      await db.runAsync(
        "INSERT INTO settings (key, value) VALUES ('theme.mode', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        themeMode,
      );
    });
  } catch (err) {
    console.warn(
      "[themePersistence] Failed to persist theme settings to DB:",
      err,
    );
  }
}

export function resetThemePersistenceMock(
  mockState?: Partial<PersistedThemeState>,
): void {
  inMemoryThemeState = {
    ...DEFAULT_STATE,
    ...mockState,
  };
  isInitialized = true;
}
