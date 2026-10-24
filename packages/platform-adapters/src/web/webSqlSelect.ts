import type { TableStore } from "./webSqlEngine";

export function selectWebSql<T>(
  store: TableStore,
  sql: string,
  params: unknown[],
): T[] {
  const trimmed = sql.trim();

  if (/PRAGMA\s+journal_mode/i.test(trimmed)) {
    return [{ journal_mode: "wal" }] as unknown as T[];
  }

  if (/FROM\s+sqlite_master/i.test(trimmed)) {
    return store.schemaObjects as unknown as T[];
  }

  if (/FROM\s+settings\b/i.test(trimmed)) {
    if (params.length > 0) {
      const key = String(params[0]);
      const val = store.settings.get(key);
      return (val !== undefined ? [{ key, value: val }] : []) as unknown as T[];
    }
    return [...store.settings.entries()].map(([key, value]) => ({
      key,
      value,
    })) as unknown as T[];
  }

  if (/FROM\s+notes_fts\b/i.test(trimmed)) {
    const query = String(params[0] ?? "")
      .replace(/["*]/g, "")
      .toLowerCase()
      .trim();
    const terms = query.split(/\s+/).filter(Boolean);
    const scored: Array<Record<string, unknown>> = [];

    for (const [path, content] of store.notesFts.entries()) {
      const lower = content.toLowerCase();
      if (terms.every((t) => lower.includes(t))) {
        let hits = 0;
        for (const t of terms) {
          hits += lower.split(t).length - 1;
        }
        const meta = store.notes.get(path);
        const snippet = content.slice(0, 120).replace(/\n+/g, " ");
        scored.push({
          path,
          title: meta?.title ?? path.replace(/\.md$/i, ""),
          mtime: meta?.mtime ?? 0,
          score: -hits,
          snippet,
        });
      }
    }

    scored.sort(
      (a, b) =>
        Number(a.score) - Number(b.score) ||
        String(a.path).localeCompare(String(b.path)),
    );
    return scored as unknown as T[];
  }

  if (/SELECT\s+COUNT\(\*\)\s+as\s+count\s+FROM\s+notes\b/i.test(trimmed)) {
    return [{ count: store.notes.size }] as unknown as T[];
  }

  if (/FROM\s+notes\b/i.test(trimmed)) {
    let rows = [...store.notes.values()];
    if (/WHERE\s+path\s+IN/i.test(trimmed) && params.length > 0) {
      const set = new Set(params.map(String));
      rows = rows.filter((r) => set.has(String(r.path)));
    }
    rows.sort((a, b) => String(a.path).localeCompare(String(b.path)));
    return rows as unknown as T[];
  }

  if (/FROM\s+links\b/i.test(trimmed)) {
    let rows = [...store.links];
    if (/target_path\s*=\s*\$1/i.test(trimmed) && params.length > 0) {
      const target = String(params[0]);
      rows = rows.filter(
        (l) => l.target_path === target && Number(l.resolved) === 1,
      );
      rows.sort((a, b) =>
        String(a.source_path).localeCompare(String(b.source_path)),
      );
    } else if (/WHERE\s+resolved\s*=\s*1/i.test(trimmed)) {
      rows = rows.filter((l) => Number(l.resolved) === 1);
    }
    return rows as unknown as T[];
  }

  if (/FROM\s+reminders\b/i.test(trimmed)) {
    let rows = [...store.reminders];
    if (/WHERE\s+note_path\s*=\s*\$1/i.test(trimmed)) {
      const notePath = String(params[0]);
      rows = rows
        .filter((r) => r.note_path === notePath)
        .sort((a, b) => Number(a.line) - Number(b.line));
    } else if (/due_at_utc\s*>=\s*\$1/i.test(trimmed)) {
      const nowUtc = String(params[0]);
      const limit = Number(params[1] ?? 20);
      rows = rows
        .filter((r) => Number(r.done) === 0 && String(r.due_at_utc) >= nowUtc)
        .sort((a, b) =>
          String(a.due_at_utc).localeCompare(String(b.due_at_utc)),
        )
        .slice(0, limit);
    } else if (/due_at_utc\s*<\s*\$1/i.test(trimmed)) {
      const nowUtc = String(params[0]);
      rows = rows
        .filter((r) => Number(r.done) === 0 && String(r.due_at_utc) < nowUtc)
        .sort((a, b) =>
          String(a.due_at_utc).localeCompare(String(b.due_at_utc)),
        );
    }
    return rows as unknown as T[];
  }

  return [];
}
