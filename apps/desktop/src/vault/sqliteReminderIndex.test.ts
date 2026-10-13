import { emptyNoteTagSet, type Note } from "@app/core-types";
import type Database from "@tauri-apps/plugin-sql";
import { describe, expect, it, vi } from "vitest";
import {
  clearReminders,
  queryOverdueReminders,
  queryRemindersByNote,
  queryUpcomingReminders,
  removeRemindersBatch,
  replaceRemindersBatch,
  type ReminderRow,
} from "./sqliteReminderIndex";
import { noteFromMarkdown } from "./noteFromMarkdown";

describe("sqliteReminderIndex", () => {
  it("persists reminders and queries upcoming, overdue, and by note", async () => {
    const executed: { sql: string; params: unknown[] }[] = [];
    const storedRows: ReminderRow[] = [];

    const db = {
      execute: vi.fn(async (sql: string, params: unknown[]) => {
        executed.push({ sql, params });
        if (sql.includes("INSERT INTO reminders")) {
          // Flatten params into rows
          for (let i = 0; i < params.length; i += 6) {
            storedRows.push({
              id: storedRows.length + 1,
              note_path: params[i] as string,
              line: params[i + 1] as number,
              due_at_utc: params[i + 2] as string,
              tz: params[i + 3] as string,
              text: params[i + 4] as string,
              done: params[i + 5] as number,
            });
          }
        }
      }),
      select: vi.fn(async (sql: string, params: unknown[]) => {
        if (sql.includes("WHERE done = 0 AND due_at_utc >=")) {
          const now = params[0] as string;
          const limit = params[1] as number;
          return storedRows
            .filter((r) => r.done === 0 && r.due_at_utc >= now)
            .slice(0, limit);
        }
        if (sql.includes("WHERE done = 0 AND due_at_utc <")) {
          const now = params[0] as string;
          return storedRows.filter((r) => r.done === 0 && r.due_at_utc < now);
        }
        if (sql.includes("WHERE note_path = $1")) {
          const path = params[0] as string;
          return storedRows.filter((r) => r.note_path === path);
        }
        return [];
      }),
    } as unknown as Database;

    const note: Note = {
      path: "work/tasks.md",
      title: "Tasks",
      frontmatter: {},
      content: [
        "- [ ] Upcoming task (@2026-10-20 14:00 Z)",
        "- [ ] Overdue task (@2026-10-10 09:00 Z)",
      ].join("\n"),
      outlinks: [],
      tags: emptyNoteTagSet(),
      mtime: 1000,
    };

    await replaceRemindersBatch(db, [note]);

    expect(db.execute).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM reminders WHERE note_path IN ($1)"),
      ["work/tasks.md"],
    );
    expect(db.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO reminders"),
      expect.arrayContaining(["work/tasks.md", 1, "2026-10-20T14:00:00.000Z"]),
    );

    const upcoming = await queryUpcomingReminders(
      db,
      10,
      "2026-10-15T00:00:00.000Z",
    );
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].text).toBe("Upcoming task");

    const overdue = await queryOverdueReminders(db, "2026-10-15T00:00:00.000Z");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].text).toBe("Overdue task");

    const byNote = await queryRemindersByNote(db, "work/tasks.md");
    expect(byNote).toHaveLength(2);
  });

  it("checking the box flips done and removes it from upcoming", async () => {
    let currentReminderRows: ReminderRow[] = [];

    const db = {
      execute: vi.fn(async (sql: string, params: unknown[]) => {
        if (sql.includes("DELETE FROM reminders")) {
          const paths = params as string[];
          currentReminderRows = currentReminderRows.filter(
            (r) => !paths.includes(r.note_path),
          );
        }
        if (sql.includes("INSERT INTO reminders")) {
          for (let i = 0; i < params.length; i += 6) {
            currentReminderRows.push({
              id: currentReminderRows.length + 1,
              note_path: params[i] as string,
              line: params[i + 1] as number,
              due_at_utc: params[i + 2] as string,
              tz: params[i + 3] as string,
              text: params[i + 4] as string,
              done: params[i + 5] as number,
            });
          }
        }
      }),
      select: vi.fn(async (sql: string, params: unknown[]) => {
        if (sql.includes("WHERE done = 0 AND due_at_utc >=")) {
          const now = params[0] as string;
          const limit = params[1] as number;
          return currentReminderRows
            .filter((r) => r.done === 0 && r.due_at_utc >= now)
            .slice(0, limit);
        }
        if (sql.includes("WHERE note_path = $1")) {
          const path = params[0] as string;
          return currentReminderRows.filter((r) => r.note_path === path);
        }
        return [];
      }),
    } as unknown as Database;

    const uncompletedMarkdown = "- [ ] Buy milk (@2026-10-25 10:00 Z)";
    const noteUncompleted = noteFromMarkdown(
      "groceries.md",
      uncompletedMarkdown,
      100,
      ["groceries.md"],
    );
    await replaceRemindersBatch(db, [noteUncompleted]);

    let upcoming = await queryUpcomingReminders(
      db,
      10,
      "2026-10-15T00:00:00.000Z",
    );
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].text).toBe("Buy milk");
    expect(upcoming[0].done).toBe(0);

    // User checks the box: "- [ ]" -> "- [x]"
    const completedMarkdown = "- [x] Buy milk (@2026-10-25 10:00 Z)";
    const noteCompleted = noteFromMarkdown(
      "groceries.md",
      completedMarkdown,
      200,
      ["groceries.md"],
    );
    await replaceRemindersBatch(db, [noteCompleted]);

    // Checking the box removes it from "upcoming"
    upcoming = await queryUpcomingReminders(db, 10, "2026-10-15T00:00:00.000Z");
    expect(upcoming).toHaveLength(0);

    // Note still holds the reminder with done = 1
    const byNote = await queryRemindersByNote(db, "groceries.md");
    expect(byNote).toHaveLength(1);
    expect(byNote[0].done).toBe(1);
  });

  it("deleting and renaming a note updates rows correctly", async () => {
    let rows: ReminderRow[] = [];

    const db = {
      execute: vi.fn(async (sql: string, params: unknown[]) => {
        if (sql.includes("DELETE FROM reminders")) {
          const paths = params as string[];
          rows = rows.filter((r) => !paths.includes(r.note_path));
        }
        if (sql.includes("INSERT INTO reminders")) {
          for (let i = 0; i < params.length; i += 6) {
            rows.push({
              id: rows.length + 1,
              note_path: params[i] as string,
              line: params[i + 1] as number,
              due_at_utc: params[i + 2] as string,
              tz: params[i + 3] as string,
              text: params[i + 4] as string,
              done: params[i + 5] as number,
            });
          }
        }
      }),
      select: vi.fn(async (_sql: string, params: unknown[]) => {
        const path = params[0] as string;
        return rows.filter((r) => r.note_path === path);
      }),
    } as unknown as Database;

    const oldNote = noteFromMarkdown(
      "projects/alpha.md",
      "- [ ] Alpha milestone (@2026-11-01 09:00 Z)",
      100,
      ["projects/alpha.md"],
    );
    await replaceRemindersBatch(db, [oldNote]);
    expect(await queryRemindersByNote(db, "projects/alpha.md")).toHaveLength(1);

    // Rename: remove old path, insert new path
    await removeRemindersBatch(db, ["projects/alpha.md"]);
    const renamedNote = noteFromMarkdown(
      "projects/beta.md",
      "- [ ] Alpha milestone (@2026-11-01 09:00 Z)",
      200,
      ["projects/beta.md"],
    );
    await replaceRemindersBatch(db, [renamedNote]);

    expect(await queryRemindersByNote(db, "projects/alpha.md")).toHaveLength(0);
    expect(await queryRemindersByNote(db, "projects/beta.md")).toHaveLength(1);

    // Delete note
    await removeRemindersBatch(db, ["projects/beta.md"]);
    expect(await queryRemindersByNote(db, "projects/beta.md")).toHaveLength(0);
  });

  it("full index rebuild produces identical rows", async () => {
    let rows: ReminderRow[] = [];

    const db = {
      execute: vi.fn(async (sql: string, params: unknown[]) => {
        if (sql === "DELETE FROM reminders") {
          rows = [];
        } else if (sql.includes("DELETE FROM reminders WHERE note_path IN")) {
          const paths = params as string[];
          rows = rows.filter((r) => !paths.includes(r.note_path));
        } else if (sql.includes("INSERT INTO reminders")) {
          for (let i = 0; i < params.length; i += 6) {
            rows.push({
              id: rows.length + 1,
              note_path: params[i] as string,
              line: params[i + 1] as number,
              due_at_utc: params[i + 2] as string,
              tz: params[i + 3] as string,
              text: params[i + 4] as string,
              done: params[i + 5] as number,
            });
          }
        }
      }),
      select: vi.fn(async () => [...rows]),
    } as unknown as Database;

    const notes: Note[] = [
      noteFromMarkdown("note1.md", "- [ ] Item A (@2026-10-15 09:00 Z)", 1, [
        "note1.md",
        "note2.md",
      ]),
      noteFromMarkdown("note2.md", "- [ ] Item B (@2026-10-16 10:00 Z)", 2, [
        "note1.md",
        "note2.md",
      ]),
    ];

    await replaceRemindersBatch(db, notes);
    const initialRows = [...rows];

    // Rebuild index: clear and repersist
    await clearReminders(db);
    expect(rows).toHaveLength(0);
    await replaceRemindersBatch(db, notes);
    const rebuiltRows = [...rows];

    expect(rebuiltRows.map((r) => ({ ...r, id: 0 }))).toEqual(
      initialRows.map((r) => ({ ...r, id: 0 })),
    );
  });

  it("does not index reminder text inside fenced code blocks, inline code, or frontmatter", async () => {
    const rows: ReminderRow[] = [];

    const db = {
      execute: vi.fn(async (sql: string, params: unknown[]) => {
        if (sql.includes("INSERT INTO reminders")) {
          for (let i = 0; i < params.length; i += 6) {
            rows.push({
              id: rows.length + 1,
              note_path: params[i] as string,
              line: params[i + 1] as number,
              due_at_utc: params[i + 2] as string,
              tz: params[i + 3] as string,
              text: params[i + 4] as string,
              done: params[i + 5] as number,
            });
          }
        }
      }),
    } as unknown as Database;

    const adversarialMarkdown = [
      "---",
      "frontmatter_reminder: (@2026-10-15 09:00 Z)",
      "---",
      "```markdown",
      "- [ ] Code block reminder (@2026-10-15 09:00 Z)",
      "```",
      "- [ ] Task with `inline (@2026-10-15 09:00 Z)` reminder",
    ].join("\n");

    const note = noteFromMarkdown("safe.md", adversarialMarkdown, 1, [
      "safe.md",
    ]);
    await replaceRemindersBatch(db, [note]);

    expect(rows).toHaveLength(0);
  });
});
