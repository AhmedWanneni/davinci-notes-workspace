import { queryNotesByTag, type TagIndex } from "./buildTags";
import type {
  ParsedSearchQuery,
  SearchQueryClause,
  TagSearchClause,
} from "./searchQuery";

export interface SearchDatabase {
  select<T>(query: string, bindings?: unknown[]): Promise<T[]>;
}

export interface SearchResult {
  path: string;
  title: string;
  mtime: number;
  score: number;
  snippet?: string;
}

interface TextRow extends SearchResult {
  score: number;
  snippet: string;
}

function isTagClause(
  clause: SearchQueryClause,
): clause is SearchQueryClause & { operator: TagSearchClause } {
  return clause.operator?.kind === "tag";
}

function quoteFtsValue(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}

async function executeTextClause(
  db: SearchDatabase,
  clause: SearchQueryClause,
): Promise<TextRow[]> {
  const expression = quoteFtsValue(clause.value);
  return db.select<TextRow>(
    `SELECT notes.path, notes.title, notes.mtime,
            bm25(notes_fts) AS score,
            snippet(notes_fts, 1, '<mark>', '</mark>', '…', 24) AS snippet
       FROM notes_fts
       JOIN notes ON notes.path = notes_fts.path
      WHERE notes_fts MATCH $1`,
    [expression],
  );
}

function intersect<T>(left: Set<T>, right: Iterable<T>): Set<T> {
  const rightSet = new Set(right);
  return new Set([...left].filter((value) => rightSet.has(value)));
}

function sortResults(results: SearchResult[]): SearchResult[] {
  return results.sort(
    (left, right) =>
      left.score - right.score ||
      left.title.localeCompare(right.title) ||
      left.path.localeCompare(right.path),
  );
}

async function loadMetadata(
  db: SearchDatabase,
  paths: Set<string>,
): Promise<Map<string, SearchResult>> {
  if (paths.size === 0) return new Map();
  const values = [...paths];
  const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
  const rows = await db.select<SearchResult>(
    `SELECT path, title, mtime FROM notes WHERE path IN (${placeholders})`,
    values,
  );
  return new Map(rows.map((row) => [row.path, row]));
}

export async function executeSearchQuery(
  db: SearchDatabase,
  tagIndex: TagIndex,
  query: ParsedSearchQuery,
): Promise<SearchResult[]> {
  if (query.clauses.length === 0 || query.errors.length > 0) return [];

  const positive = query.clauses.filter((clause) => !clause.excluded);
  const excluded = query.clauses.filter((clause) => clause.excluded);
  let candidatePaths: Set<string> | undefined;
  const scores = new Map<string, SearchResult>();

  for (const clause of positive) {
    if (isTagClause(clause)) {
      candidatePaths = candidatePaths
        ? intersect(
            candidatePaths,
            queryNotesByTag(tagIndex, clause.operator.tagKey),
          )
        : queryNotesByTag(tagIndex, clause.operator.tagKey);
      continue;
    }

    const rows = await executeTextClause(db, clause);
    const paths = rows.map((row) => row.path);
    candidatePaths = candidatePaths
      ? intersect(candidatePaths, paths)
      : new Set(paths);
    for (const row of rows) {
      const current = scores.get(row.path);
      if (!current || row.score < current.score) scores.set(row.path, row);
    }
  }

  if (!candidatePaths) {
    candidatePaths = new Set(
      (await db.select<{ path: string }>("SELECT path FROM notes")).map(
        (row) => row.path,
      ),
    );
  }

  for (const clause of excluded) {
    const paths = isTagClause(clause)
      ? queryNotesByTag(tagIndex, clause.operator.tagKey)
      : (await executeTextClause(db, clause)).map((row) => row.path);
    for (const path of paths) candidatePaths.delete(path);
  }

  const metadata = await loadMetadata(db, candidatePaths);
  const results = [...candidatePaths].map((path) => {
    const row = scores.get(path) ?? metadata.get(path);
    return { ...row, path, score: row?.score ?? 0 } as SearchResult;
  });
  return sortResults(results);
}
