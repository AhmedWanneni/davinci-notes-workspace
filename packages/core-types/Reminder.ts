/** A parsed reminder associated with a note line. */
export interface Reminder {
  /** 1-based line number in the source note. */
  line: number;
  /** ISO-8601 UTC due instant (e.g. `2026-10-15T09:00:00.000Z`). */
  dueAtUtc: string;
  /** Timezone identifier (e.g. `Europe/London` or `UTC`). */
  tz: string;
  /** Clean task text with checkbox prefix and reminder token removed. */
  text: string;
  /** Completion state from task checkbox (`[x]`/`[-]` vs `[ ]`). */
  done: boolean;
}
