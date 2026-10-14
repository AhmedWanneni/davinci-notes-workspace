# ADR-0184: Reminder recurrence syntax and completion model

## Status

Accepted

## Context

Phase 5 of the reminders feature requires support for recurring task reminders in Markdown notes. In DaVinci Notes, tasks with reminders are authored as standard checklist items (`- [ ] <task> (@YYYY-MM-DD[ HH:mm])`).

To support recurrence while adhering to PERFORMANCE.md and the lightweight/fast principle:
1. Syntax must be human-readable, plain-text Markdown compatible with the existing `(@...)` token convention established in ADR-0182.
2. Full iCalendar RRULE (RFC 5545) is explicitly out of scope: it requires parsing complex recurrence grammars (`BYSETPOS`, `BYDAY=-1SU`, etc.), pulling in heavy dependencies (e.g. `rrule` library is ~30 KB minified / 8.5 KB gzip), and adds runtime overhead for edge cases unnecessary in a note-taking application.
3. Scope is constrained to:
   - Daily (`daily`, `every day`, `every N days`)
   - Weekly (`weekly`, `every week`, `every N weeks`, optionally with specific weekdays)
   - Monthly (`monthly`, `every month`, `every N months`, preserving anchor day / month-end)
   - Yearly (`yearly`, `every year`, `every N years`, preserving leap days)
4. Two architectural decisions must be resolved:
   - Whether the next occurrence is computed from the **due date** or from the **completion date**.
   - Whether completing a recurring task **rolls the due date forward in place** or **appends a new task line**.

## Decision

### 1. Token Syntax: Slash-Delimited Recurrence Rule inside `(@...)`
Recurrence is expressed after an optional `/` delimiter inside the existing reminder token:
`(@YYYY-MM-DD[ HH:mm[:ss]][ /<rule>][ <tz>])`

Supported rule expressions:
- **Frequency keywords**: `/daily`, `/weekly`, `/monthly`, `/yearly`
- **Natural interval syntax**:
  - `/every [N] day|days` (e.g. `/every day`, `/every 3 days`, shorthand `/1d`, `/3d`)
  - `/every [N] week|weeks` (e.g. `/every week`, `/every 2 weeks`, shorthand `/1w`, `/2w`)
  - `/every [N] week|weeks on <weekdays>` (e.g. `/every week on monday, wednesday, friday`, `/weekly on mon, fri`)
  - `/every [N] month|months` (e.g. `/every month`, `/every 3 months`, shorthand `/1m`, `/3m`, with optional anchor `/monthly on 31st`)
  - `/every [N] year|years` (e.g. `/every year`, `/every 2 years`, shorthand `/1y`, `/2y`, with optional `/yearly on feb 29`)

*Rationale*: Keeping the recurrence inside the existing `(@...)` boundary prevents token fragmentation, ensures standard wikilink and tag parsers ignore it, and keeps the reminder token atomic for CodeMirror live-preview replacement and picker editing.

### 2. Next Occurrence Anchor: Computed from Due Date
The next occurrence is computed from the **current due date**, NOT the completion date.

*Rationale*:
- **Rhythm preservation**: Real-world tasks follow scheduled calendar rhythms (e.g. "Weekly team sync on Monday", "Pay rent on the 1st of the month"). If a user completes their Monday task on Tuesday, computing from the completion date drifts subsequent occurrences to Tuesday, breaking the scheduled cadence.
- **Deterministic and reproducible**: Computing from the due date means `next(due)` is a pure, idempotent function of the current date and the rule. Completing N times in succession advances cleanly through scheduled intervals ($D_0 \to D_0 + \Delta \to D_0 + 2\Delta$).
- **Multi-device sync resilience**: If two devices complete the same recurring reminder offline, both compute the exact same next due date independently, avoiding divergent state.

### 3. Completion Model: In-Place Roll-Forward
On completing a recurring task (whether checked in the editor, marked done in the Reminders view, or completed via a notification action):
- The due date within the reminder token is updated **in-place** to the next occurrence date (`(@<next-date> <rule>)`).
- The task checkbox remains unchecked (`- [ ]`).

*Rationale*:
- **File cleanliness and bounds**: Appending a new line on every completion causes note files to grow linearly without bound, creating clutter and line-shifting throughout the document. In-place roll forward keeps notes compact and focused.
- **Sync conflict minimization**: Appending new lines across concurrent devices causes duplicate tasks to be created during file sync. In-place roll forward results in an identical file edit on both devices.
- Note history and Git version history already provide a durable audit trail of past edits.

### 4. Calendar Boundary Handling

#### Month-End (The 31st Across a Year)
- When advancing months, the day of month is clamped to the maximum days in the target month (e.g. Jan 31 $\to$ Feb 28 in non-leap years, Apr 30, Jun 30, etc.).
- The original target anchor day (e.g. 31st) is preserved across rollovers (either stored in the parsed rule or encoded in `/monthly on 31st`). Thus, advancing from Feb 28 returns to Mar 31, not Mar 28.

#### Leap Days (February 29 Yearly)
- A reminder due on Feb 29 recurs on Feb 28 in non-leap years, but restores to Feb 29 when the next leap year (e.g. 2028) is reached.

#### Daylight Saving Time (DST)
- Wall-clock time is preserved across DST transitions in the user's local timezone.
- A reminder scheduled for `10:00 AM Europe/London` stays `10:00 AM Europe/London` before and after clock transitions (e.g. British Summer Time UTC+1 to GMT UTC+0). The UTC instant adjusts from `09:00Z` to `10:00Z`, maintaining local schedule expectations without 1-hour shifts.

### 5. Multi-Device Sync Conflict Resolution
When two devices share a vault and both mark the same recurring task complete:
- Because the next occurrence is deterministically computed from the current due date (e.g. Oct 14 $\to$ Oct 21), both devices make the identical file edit (`- [ ] <task> (@2026-10-21 /weekly)`).
- When synced via file-sync or Git, the diff is identical, producing 0 merge conflict and preventing duplicate advancements.

## Consequences

- 0 KB external bundle overhead: implemented in pure TypeScript using standard date arithmetic and `Intl.DateTimeFormat`.
- Markdown remains the sole durable source of truth; no hidden recurring task databases.
- Single responsibility: parsing and recurrence arithmetic is encapsulated in `@app/indexer/recurrenceRule.ts`.
