# ADR-0176: Where the template engine runs and the clip payload contract

## Status

Proposed (needs owner input, see "Open decisions"). Draft only; no code.

## Context

The template engine needs two different kinds of context:

- The **page**: CSS-selector variables, Schema.org JSON-LD, meta tags, the
  extracted article, the selection, and highlights. This only exists in the
  extension, in the page's DOM.
- **Vault**: target folder, existing-file checks, note-name collision suffixes,
  daily-note resolution, append/prepend into an existing note. This only exists
  in the desktop app.

Doing all rendering in one place either (a) ships the whole page DOM to the
desktop (impossible/unnecessary) or (b) has the extension render blindly without
knowing whether the target file exists.

Templates are untrusted data (authored by the user, importable as JSON). They must
never be evaluated: no `eval`, no `new Function`, no remote code, no arbitrary
network calls from template logic.

## Options

### Option 1 — Extension renders everything; desktop writes bytes

- Pros: the desktop is a dumb, safe sink; one render pass.
- Cons: the extension cannot resolve note-name collisions, folder existence,
  append targets, or daily-note paths — the desktop must still adjust, so a
  second pass exists anyway (just unowned).

### Option 2 — Extension collects variables; desktop renders everything

- Pros: one authoritative renderer, with full vault context.
- Cons: requires shipping the raw page DOM / all selector inputs to the desktop;
  the desktop could not evaluate CSS selectors against a page it does not have.

### Option 3 — Split by responsibility, one shared engine

- The extension owns page-derived work; the desktop owns vault-derived work; both
  use `clipper-core` for the parts each needs.

## Decision (recommended)

**Option 3**, with this exact split:

**Extension (in `clipper-core` + DOM adapters):**
1. Resolve *all page variables*: preset (`title`, `author`, `content`,
   `contentHtml`, `date`, `description`, `domain`, `favicon`, `fullHtml`,
   `highlights`, `image`, `language`, `published`, `selection`, `selectionHtml`,
   `site`, `time`, `url`, `words`), `meta:`, `selector:` / `selectorHtml:`,
   `schema:` variables.
2. Select the template (auto-apply rules by URL prefix / regex / Schema.org).
3. Apply filters and render the fields that do not need vault state:
   `source.*`, property values, `tags`, and the note **body**.
4. Produce a `ClipPayload` (§schema below) and send it.

**Desktop (in `clipper-core` + a JS service):**
1. Validate the payload (authenticated transport already established, ADR-0173);
   re-validate `folder`/`noteName` as hostile input.
2. Resolve vault context: the open vault, folder creation, **note-name collision
   suffixing** (ADR-0110 pattern), and **behavior** — create / append-bottom /
   append-top / prepend / daily-append / daily-prepend — including merging
   frontmatter into an existing note.
3. Write through the canonical vault write path (ADR-0177) and index.

`clipper-core` therefore exposes pure helpers used by both sides: the renderer +
filters (extension), `safe_name` + note-name formatting + daily-note date + path
normalization/validation helpers (both).

**Rules that make this safe:**
- Templates are data. The renderer only ever resolves a *closed* set of named
  variables/filters; unknown tokens render as literal text or an explicit
  "unknown" marker, never as code.
- No template value is ever `eval`ed, used as a property path into arbitrary
  objects, or used to make a network request.
- The body is sanitized/converted before it enters the payload; the payload body
  is plain Markdown.
- The desktop **never trusts** `folder`, `noteName`, or any `source.*` field for
  filesystem decisions.

### Payload schema (v1, summary)

```
ClipPayload {
  version: 1
  clipId: string            // uuid v4 — idempotency key, echoed in the ack
  capturedAt: string        // ISO 8601
  mode: "full" | "selection" | "highlights"
  templateId: string
  behavior: "create" | "append-bottom" | "append-top"
          | "prepend" | "daily-append" | "daily-prepend"
  target: { vaultId?: string, folder: string, noteName: string }  // UNTRUSTED
  source: { url,title,site?,domain?,author?,published?,description?,
            image?,favicon?,language?,wordCount? }
  properties: Record<string, string | string[] | number>
  tags: string[]            // default ["clippings"]
  body: string              // rendered Markdown (already sanitized)
  contentHash: string       // normalized-body hash for dedupe
  highlights?: Array<{ text, selector?, createdAt }>
  attachments?: Array<{ sourceUrl, suggestedName, alt? }>
}
```

## Consequences

- No DOM is ever sent to the desktop; no vault state is assumed by the extension.
- Two places call `clipper-core`, so it must stay pure and well-tested — this is a
  feature, and it is what makes the future in-app "clip from URL" cheap.
- The note-name/collision/daily-note logic lives once, in `clipper-core`, and is
  exercised by desktop tests so the extension's preview can predict the final path
  without guessing.

## Performance cost

- Rendering is string work over already-extracted content; bounded by the payload
  size cap. No DOM walk on the desktop. No per-keystroke rendering (preview edits
  are debounced).

## Open decisions

- Confirm the split (extension renders body/properties; desktop resolves vault
  behavior/paths) over the alternatives.
- Confirm the payload field set, especially whether `attachments` metadata ships
  in v1 (the bytes are Phase 6).
