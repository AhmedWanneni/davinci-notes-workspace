import type Database from "@tauri-apps/plugin-sql";

export async function queryBacklinkSources(
  db: Database,
  targetPath: string,
): Promise<string[]> {
  const rows = await db.select<{ source_path: string }[]>(
    `SELECT source_path FROM links
     WHERE target_path = $1 AND resolved = 1
     ORDER BY source_path`,
    [targetPath],
  );
  return rows.map((row) => row.source_path);
}

export async function countIndexedNotes(db: Database): Promise<number> {
  const rows = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) as count FROM notes",
  );
  return rows[0]?.count ?? 0;
}

/** Returns the existing note paths so a watcher batch can repair missed directory events. */
export async function listIndexedNotePaths(db: Database): Promise<string[]> {
  const rows = await db.select<{ path: string }[]>(
    "SELECT path FROM notes ORDER BY path",
  );
  return rows.map((row) => row.path);
}
