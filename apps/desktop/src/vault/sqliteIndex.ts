import type { Note } from "@app/core-types";
import type { GraphIndex } from "@app/indexer";
import Database from "@tauri-apps/plugin-sql";

/** Must match `db::DB_URL` in src-tauri. */
export const VAULT_INDEX_DB = "sqlite:vault-index.db";

let dbPromise: Promise<Database> | undefined;

export async function getVaultIndexDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load(VAULT_INDEX_DB);
  }
  return dbPromise;
}

export async function clearVaultIndex(db: Database): Promise<void> {
  await db.execute("DELETE FROM links");
  await db.execute("DELETE FROM notes");
}

export async function upsertNote(db: Database, note: Note): Promise<void> {
  await db.execute(
    `INSERT INTO notes (path, title, frontmatter, mtime)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT(path) DO UPDATE SET
       title = excluded.title,
       frontmatter = excluded.frontmatter,
       mtime = excluded.mtime`,
    [note.path, note.title, JSON.stringify(note.frontmatter), note.mtime],
  );
}

export async function replaceLinksForNote(
  db: Database,
  note: Note,
): Promise<void> {
  await db.execute("DELETE FROM links WHERE source_path = $1", [note.path]);

  for (const link of note.outlinks) {
    await db.execute(
      `INSERT INTO links (
         source_path, target_path, target_raw, display_text,
         heading, block_id, resolved
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        note.path,
        link.target,
        link.targetRaw,
        link.displayText ?? null,
        link.heading ?? null,
        link.blockId ?? null,
        link.resolved ? 1 : 0,
      ],
    );
  }
}

export async function removeNoteFromIndex(
  db: Database,
  path: string,
): Promise<void> {
  await db.execute("DELETE FROM notes WHERE path = $1", [path]);
}

export async function persistNote(db: Database, note: Note): Promise<void> {
  await upsertNote(db, note);
  await replaceLinksForNote(db, note);
}

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

export async function queryFullGraphIndex(db: Database): Promise<GraphIndex> {
  const nodes = await db.select<{ path: string; title: string }[]>(
    "SELECT path, title FROM notes",
  );

  const links = await db.select<{ source_path: string; target_path: string }[]>(
    "SELECT source_path, target_path FROM links WHERE resolved = 1",
  );

  const graph: GraphIndex = {
    nodes: new Map(),
    edges: [],
    backlinks: new Map(),
  };

  for (const n of nodes) {
    graph.nodes.set(n.path, { id: n.path, label: n.title });
  }

  for (const l of links) {
    graph.edges.push({ source: l.source_path, target: l.target_path });

    // Ensure target nodes exist in the graph (handles unresolved or missing nodes)
    if (!graph.nodes.has(l.target_path)) {
      graph.nodes.set(l.target_path, {
        id: l.target_path,
        label:
          l.target_path.replace(/\.md$/i, "").split("/").pop() ?? l.target_path,
      });
    }
  }

  return graph;
}
