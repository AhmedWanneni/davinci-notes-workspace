import type { SqliteQueryResult } from "../SqliteAdapter";

export interface TableStore {
  notes: Map<string, Record<string, unknown>>;
  links: Array<Record<string, unknown>>;
  reminders: Array<Record<string, unknown>>;
  settings: Map<string, string>;
  notesFts: Map<string, string>;
  schemaObjects: Array<{ type: string; name: string }>;
}

const SETTINGS_STORAGE_KEY = "davinci:web-sqlite:settings";

export function createInitialTableStore(): TableStore {
  const settings = new Map<string, string>();
  try {
    if (
      typeof localStorage !== "undefined" &&
      typeof localStorage.getItem === "function"
    ) {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        for (const [k, v] of Object.entries(parsed)) {
          settings.set(k, v);
        }
      }
    }
  } catch {
    // ignore storage restrictions
  }

  return {
    notes: new Map(),
    links: [],
    reminders: [],
    settings,
    notesFts: new Map(),
    schemaObjects: [],
  };
}

function persistSettings(settings: Map<string, string>): void {
  try {
    if (
      typeof localStorage !== "undefined" &&
      typeof localStorage.setItem === "function"
    ) {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(Object.fromEntries(settings.entries())),
      );
    }
  } catch {
    // ignore
  }
}

export function cloneTableStore(store: TableStore): TableStore {
  return {
    notes: new Map([...store.notes.entries()].map(([k, v]) => [k, { ...v }])),
    links: store.links.map((l) => ({ ...l })),
    reminders: store.reminders.map((r) => ({ ...r })),
    settings: new Map(store.settings),
    notesFts: new Map(store.notesFts),
    schemaObjects: [...store.schemaObjects],
  };
}

export function executeWebSql(
  store: TableStore,
  sql: string,
  params: unknown[],
  nextId: () => number,
): SqliteQueryResult {
  const trimmed = sql.trim();

  const createTableRegex =
    /CREATE\s+(?:VIRTUAL\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = createTableRegex.exec(trimmed)) !== null) {
    const tableName = match[1];
    if (!store.schemaObjects.some((o) => o.name === tableName)) {
      store.schemaObjects.push({ type: "table", name: tableName });
    }
  }

  if (/INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+settings\b/i.test(trimmed)) {
    const key = String(params[0] ?? "");
    const value = String(params[1] ?? "");
    store.settings.set(key, value);
    persistSettings(store.settings);
    return { rowsAffected: 1 };
  }

  if (/DELETE\s+FROM\s+settings\b/i.test(trimmed)) {
    const key = String(params[0] ?? "");
    const existed = store.settings.delete(key);
    persistSettings(store.settings);
    return { rowsAffected: existed ? 1 : 0 };
  }

  if (/INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+notes_fts\b/i.test(trimmed)) {
    let affected = 0;
    for (let i = 0; i + 1 < params.length; i += 2) {
      store.notesFts.set(String(params[i]), String(params[i + 1]));
      affected++;
    }
    return { rowsAffected: affected };
  }

  if (/DELETE\s+FROM\s+notes_fts\b/i.test(trimmed)) {
    if (params.length === 0) {
      const count = store.notesFts.size;
      store.notesFts.clear();
      return { rowsAffected: count };
    }
    let affected = 0;
    for (const p of params) {
      if (store.notesFts.delete(String(p))) affected++;
    }
    return { rowsAffected: affected };
  }

  if (/INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+notes\b/i.test(trimmed)) {
    let affected = 0;
    for (let i = 0; i + 3 < params.length; i += 4) {
      const path = String(params[i]);
      store.notes.set(path, {
        path,
        title: String(params[i + 1]),
        frontmatter: String(params[i + 2]),
        mtime: Number(params[i + 3]),
      });
      affected++;
    }
    return { rowsAffected: affected };
  }

  if (/DELETE\s+FROM\s+notes\b/i.test(trimmed)) {
    if (params.length === 0) {
      const count = store.notes.size;
      store.notes.clear();
      return { rowsAffected: count };
    }
    let affected = 0;
    for (const p of params) {
      const path = String(p);
      if (store.notes.delete(path)) affected++;
      store.links = store.links.filter((l) => l.source_path !== path);
    }
    return { rowsAffected: affected };
  }

  if (/INSERT\s+INTO\s+links\b/i.test(trimmed)) {
    let affected = 0;
    for (let i = 0; i + 6 < params.length; i += 7) {
      store.links.push({
        source_path: String(params[i]),
        target_path: String(params[i + 1]),
        target_raw: String(params[i + 2]),
        display_text: params[i + 3] ?? null,
        heading: params[i + 4] ?? null,
        block_id: params[i + 5] ?? null,
        resolved: Number(params[i + 6]),
      });
      affected++;
    }
    return { rowsAffected: affected };
  }

  if (/DELETE\s+FROM\s+links\b/i.test(trimmed)) {
    if (params.length === 0) {
      const count = store.links.length;
      store.links = [];
      return { rowsAffected: count };
    }
    const pathSet = new Set(params.map(String));
    const before = store.links.length;
    if (/OR\s+target_path\s+IN/i.test(trimmed)) {
      store.links = store.links.filter(
        (l) =>
          !pathSet.has(String(l.source_path)) &&
          !pathSet.has(String(l.target_path)),
      );
    } else {
      store.links = store.links.filter(
        (l) => !pathSet.has(String(l.source_path)),
      );
    }
    return { rowsAffected: before - store.links.length };
  }

  if (/INSERT\s+INTO\s+reminders\b/i.test(trimmed)) {
    let affected = 0;
    for (let i = 0; i + 5 < params.length; i += 6) {
      store.reminders.push({
        id: nextId(),
        note_path: String(params[i]),
        line: Number(params[i + 1]),
        due_at_utc: String(params[i + 2]),
        tz: String(params[i + 3]),
        text: String(params[i + 4]),
        done: Number(params[i + 5]),
      });
      affected++;
    }
    return { rowsAffected: affected };
  }

  if (/DELETE\s+FROM\s+reminders\b/i.test(trimmed)) {
    if (params.length === 0) {
      const count = store.reminders.length;
      store.reminders = [];
      return { rowsAffected: count };
    }
    const pathSet = new Set(params.map(String));
    const before = store.reminders.length;
    store.reminders = store.reminders.filter(
      (r) => !pathSet.has(String(r.note_path)),
    );
    return { rowsAffected: before - store.reminders.length };
  }

  return { rowsAffected: 0, lastInsertId: nextId() };
}
