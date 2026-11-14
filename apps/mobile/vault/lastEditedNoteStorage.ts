import { getVaultIndexDb, withDbLock } from "../database";

const SETTINGS_KEY = "app.last_edited_note";
let inMemoryLastEdited: string | null = null;

export async function getLastEditedNote(): Promise<string | null> {
  if (inMemoryLastEdited) {
    return inMemoryLastEdited;
  }
  try {
    const db = await getVaultIndexDb();
    const rows = await withDbLock(() =>
      db.getAllAsync<{ key: string; value: string }>(
        "SELECT value FROM settings WHERE key = ?",
        [SETTINGS_KEY],
      ),
    );
    if (rows.length > 0 && rows[0]?.value) {
      inMemoryLastEdited = rows[0].value;
      return inMemoryLastEdited;
    }
  } catch (err) {
    console.warn("[lastEditedNote] Failed to read from DB:", err);
  }
  return null;
}

export async function setLastEditedNote(path: string): Promise<void> {
  if (!path || path.trim() === "") return;
  inMemoryLastEdited = path;
  try {
    const db = await getVaultIndexDb();
    await withDbLock(async () => {
      await db.runAsync(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [SETTINGS_KEY, path],
      );
    });
  } catch (err) {
    console.warn("[lastEditedNote] Failed to save to DB:", err);
  }
}

export function clearCachedLastEditedNote(): void {
  inMemoryLastEdited = null;
}
