# ADR-0161: External vault change reconciliation

## Status

Accepted

## Decision

The existing `notify-debouncer-full` watcher remains the sole external-change
source. Its 400 ms batches carry creates/modifications/removals plus paired
file renames. Reconciliation reads changed files before the single SQLite lock,
then compares the filesystem listing with indexed paths inside that lock so a
missed directory event cannot leave stale index rows.

Watcher reconciliation does not pause the watcher: pausing while reading a
batch can discard a following external sync burst. Canonical app writes retain
their existing short watcher suppression.

External deletes clear open-tab timers and close the affected tabs without a
save. External renames remap open tab paths. Clean open notes reload their disk
content; an externally modified dirty note keeps its local text and reports a
conflict rather than overwriting either version.

## Consequences

No dependency, polling loop, additional watcher, or initial-bundle code is
added. SQLite reads and writes remain inside `withDbLock`; filesystem reads
happen before that short critical section.
