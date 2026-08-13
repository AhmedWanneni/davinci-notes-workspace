import type Database from "@tauri-apps/plugin-sql";

/**
 * Get a setting from the database.
 */
export async function getSetting(
  db: Database,
  key: string,
): Promise<string | null> {
  try {
    const rows = await db.select<{ value: string }[]>(
      "SELECT value FROM settings WHERE key = $1 LIMIT 1",
      [key],
    );
    return rows[0]?.value ?? null;
  } catch (error) {
    console.error(`Failed to get setting ${key}:`, error);
    return null;
  }
}

/**
 * Set a setting in the database.
 */
export async function setSetting(
  db: Database,
  key: string,
  value: string,
): Promise<void> {
  try {
    await db.execute(
      `INSERT INTO settings (key, value)
       VALUES ($1, $2)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value],
    );
  } catch (error) {
    console.error(`Failed to set setting ${key}:`, error);
  }
}
