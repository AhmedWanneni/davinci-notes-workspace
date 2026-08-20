import type Database from "@tauri-apps/plugin-sql";
import type { Note } from "@app/core-types";

/** Replace FTS rows for one batch without loading any other note content. */
export async function replaceFtsRows(
  db: Database,
  notes: readonly Note[],
): Promise<void> {
  if (notes.length === 0) return;

  const paths = notes.map((note) => note.path);
  const placeholders = paths.map((_, index) => `$${index + 1}`).join(", ");
  await db.execute(
    `DELETE FROM notes_fts WHERE path IN (${placeholders})`,
    paths,
  );

  const values: string[] = [];
  const params: string[] = [];
  let parameter = 1;
  for (const note of notes) {
    values.push(`($${parameter}, $${parameter + 1})`);
    params.push(note.path, note.content);
    parameter += 2;
  }

  await db.execute(
    `INSERT INTO notes_fts (path, content) VALUES ${values.join(", ")}`,
    params,
  );
}

export async function removeFtsRow(
  db: Database,
  path: string,
): Promise<void> {
  await db.execute("DELETE FROM notes_fts WHERE path = $1", [path]);
}

export async function clearFtsRows(db: Database): Promise<void> {
  await db.execute("DELETE FROM notes_fts");
}
