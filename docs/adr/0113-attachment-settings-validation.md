# ADR-0113: Attachment settings validation timing

## Status

Accepted

The specified-folder path is not probed or created when settings change. The
existing native folder picker supplies a usable path, but manually persisted
or stale paths are accepted and the Phase 2 writer creates missing folders at
first use. This keeps settings changes non-blocking and avoids filesystem I/O
from the preferences panel.

The subfolder field is validated in the UI: it must be non-empty after trim
and contain no slash or backslash. Invalid edits remain local draft text,
show inline guidance, and do not replace the last valid persisted value. The
resolver therefore never receives an undefined subfolder; its existing
`attachments` default remains the schema fallback.
