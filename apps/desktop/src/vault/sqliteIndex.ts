import type { Note } from "@app/core-types";
import type { GraphIndex } from "@app/indexer";
import Database from "@tauri-apps/plugin-sql";
import { clearFtsRows, removeFtsRow, replaceFtsRows } from "./sqliteFtsIndex";

/** Must match `db::DB_URL` in src-tauri. */
export const VAULT_INDEX_DB = "sqlite:vault-index.db";

let dbPromise: Promise<Database> | undefined;

let dbWriteLock: Promise<unknown> = Promise.resolve();

export function withDbLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = dbWriteLock.then(fn, fn);
  dbWriteLock = run.catch(() => {});
  return run;
}

/** The sole transaction owner for the vault-index connection. */
export async function withDbTransaction<T>(
  db: Database,
  fn: () => Promise<T>,
): Promise<T> {
  await db.execute("BEGIN IMMEDIATE");
  try {
    const result = await fn();
    await db.execute("COMMIT");
    return result;
  } catch (error) {
    try {
      await db.execute("ROLLBACK");
    } catch (rollbackError) {
      if (
        !(rollbackError instanceof Error) ||
        !/no transaction is active/i.test(rollbackError.message)
      ) {
        console.warn("SQLite rollback was unavailable after a failed transaction", rollbackError);
      }
    }
    throw error;
  }
}

export async function getVaultIndexDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load(VAULT_INDEX_DB).then(async (db) => {
      // Set the wait window before WAL mode, which itself needs a write lock.
      await db.execute("PRAGMA busy_timeout=10000;");
      await db.execute("PRAGMA journal_mode=WAL;");
      await db.execute("PRAGMA synchronous=NORMAL;");
      return db;
    });
  }
  return dbPromise;
}

export async function verifyJournalMode(db: Database): Promise<string> {
  const rows = await db.select<{ journal_mode: string }[]>(
    "PRAGMA journal_mode;",
  );
  return rows[0]?.journal_mode?.toLowerCase() ?? "unknown";
}

export async function clearVaultIndex(db: Database): Promise<void> {
  await db.execute("DELETE FROM links");
  await db.execute("DELETE FROM notes");
  await clearFtsRows(db);
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
  await removeFtsRow(db, path);
}

/** Batch persist notes and outlinks to SQLite using chunked bulk operations. */
export async function persistNotesBatch(
  db: Database,
  notes: readonly Note[],
  batchSize = 50,
): Promise<void> {
  if (notes.length === 0) {
    return;
  }

  for (let i = 0; i < notes.length; i += batchSize) {
    const chunk = notes.slice(i, i + batchSize);

    // 1. Bulk upsert notes
    const noteClauses: string[] = [];
    const noteParams: unknown[] = [];
    let pIdx = 1;

    for (const note of chunk) {
      noteClauses.push(`($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3})`);
      noteParams.push(
        note.path,
        note.title,
        JSON.stringify(note.frontmatter),
        note.mtime,
      );
      pIdx += 4;
    }

    await db.execute(
      `INSERT INTO notes (path, title, frontmatter, mtime)
       VALUES ${noteClauses.join(", ")}
       ON CONFLICT(path) DO UPDATE SET
         title = excluded.title,
         frontmatter = excluded.frontmatter,
         mtime = excluded.mtime`,
      noteParams,
    );

    // 2. Delete existing links for batch source paths
    const sourcePaths = chunk.map((n) => n.path);
    const inClauses = sourcePaths.map((_, idx) => `$${idx + 1}`).join(", ");
    await db.execute(
      `DELETE FROM links WHERE source_path IN (${inClauses})`,
      sourcePaths,
    );

    // 3. Bulk insert outlinks (chunked by batchSize to keep parameter count low)
    const allOutlinks: {
      sourcePath: string;
      link: (typeof chunk)[0]["outlinks"][0];
    }[] = [];
    for (const note of chunk) {
      for (const link of note.outlinks) {
        allOutlinks.push({ sourcePath: note.path, link });
      }
    }

    if (allOutlinks.length > 0) {
      for (let j = 0; j < allOutlinks.length; j += batchSize) {
        const linkChunk = allOutlinks.slice(j, j + batchSize);
        const linkClauses: string[] = [];
        const linkParams: unknown[] = [];
        let lIdx = 1;

        for (const item of linkChunk) {
          linkClauses.push(
            `($${lIdx}, $${lIdx + 1}, $${lIdx + 2}, $${lIdx + 3}, $${lIdx + 4}, $${lIdx + 5}, $${lIdx + 6})`,
          );
          linkParams.push(
            item.sourcePath,
            item.link.target,
            item.link.targetRaw,
            item.link.displayText ?? null,
            item.link.heading ?? null,
            item.link.blockId ?? null,
            item.link.resolved ? 1 : 0,
          );
          lIdx += 7;
        }

        await db.execute(
          `INSERT INTO links (
             source_path, target_path, target_raw, display_text,
             heading, block_id, resolved
           ) VALUES ${linkClauses.join(", ")}`,
          linkParams,
        );
      }
    }

    await replaceFtsRows(db, chunk);
  }
}

export async function persistNote(db: Database, note: Note): Promise<void> {
  await persistNotesBatch(db, [note]);
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
