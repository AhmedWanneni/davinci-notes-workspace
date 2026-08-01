# Coding Best Practices

For an AI-assisted codebase, the goal is discoverability and reviewability over cleverness. Every rule below exists to keep a human able to open a file, understand it in isolation, and trust `git blame`/`git log` months later.

---

## File Size

- **Soft cap: 150-200 lines. Hard cap: 250.** Enforce with ESLint, don't rely on discipline alone:

```js
// .eslintrc
rules: {
  "max-lines": ["error", { max: 250, skipBlankLines: true, skipComments: true }]
}
```

- If a file needs a second heading in your head to explain it, split it.
- AI tends to keep appending to an existing file rather than creating a new one — watch for this in every review, it's the #1 source of file bloat.

## One Responsibility Per File

- A component file has the component (and maybe its own small subcomponents if they're not reused elsewhere).
- A hook file has one hook.
- `parseLinks.ts` parses links. Nothing else lives there.
- **Banned files**: `utils.ts`, `helpers.ts`, `types.ts` at the project root. These become dumping grounds — every AI session adds "just one more helper" and within weeks it's an unreviewable 800-line file with no theme.

## Colocation

- Types live next to the code that produces/consumes them, not in a shared types file.
  ```
  indexer/parseLinks.ts     ← exports parseLinks() AND interface Link
  indexer/parseFrontmatter.ts ← exports parseFrontmatter() AND interface Frontmatter
  ```
- When you ask AI to touch link parsing, one file is the entire context it needs. No hunting across a `types/` folder.
- Exception: types genuinely shared across 3+ unrelated modules (e.g. `Vault`, `Note`) can live in a `core/types.ts` — but that's a deliberate exception, not a default.

## Folder Structure

Feature-first, not type-first:

```
src/
├── components/
│   ├── Editor/
│   │   ├── EditorView.tsx
│   │   ├── wikilinkExtension.ts
│   │   ├── livePreviewDecorations.ts
│   │   └── index.ts            # barrel export
│   ├── Sidebar/
│   ├── Graph/
│   ├── Backlinks/
│   └── CommandPalette/
├── indexer/
│   ├── parseLinks.ts
│   ├── parseFrontmatter.ts
│   ├── buildGraph.ts
│   ├── search.ts
│   └── index.ts
├── state/
│   ├── vaultStore.ts
│   ├── editorStore.ts
│   └── index.ts
└── core/
    └── types.ts                 # only truly shared types
```

Avoid `components/`, `pages/`, `hooks/` as flat dumping grounds where 40 unrelated files sit at the same level. Group by feature; within a feature, split by concern.

## Barrel Files

Each module folder gets an `index.ts` that re-exports its public surface:

```ts
// indexer/index.ts
export { parseLinks } from "./parseLinks";
export { buildGraph } from "./buildGraph";
export type { Link } from "./parseLinks";
```

Consumers import `from "@/indexer"`, not `from "@/indexer/parseLinks"`. Internal files can be split/renamed/reorganized later without touching every import site.

## Naming

- **File name = primary export name.** `useVaultStore.ts` exports `useVaultStore`. No guessing.
- No invented abbreviations that drift between AI sessions (`idx.ts` today, `index-utils.ts` tomorrow). Pin exact names in this doc if ambiguity is likely.
- Boolean flags read as questions: `isResolved`, `hasBacklinks`, not `resolved`, `backlinks_flag`.

---

## Working With AI

### Scope every prompt to one concern
- Bad: "build the whole indexer"
- Good: "add wikilink parsing to `indexer/parseLinks.ts`, matching the `Link` interface in this file"

One prompt = one file or one tightly-related pair of files. Large multi-file generations are unreviewable and tend to blur module boundaries.

### One AI change = one commit
Don't let a single session touch the indexer *and* the UI *and* the DB schema. Ask for them separately, commit separately. This is what makes it possible to revert a bad AI-generated change without losing unrelated good ones sitting in the same diff.

### Review every diff before accepting
If a diff is too big to actually read line-by-line, it's too big to accept as-is — ask for it split up rather than skimming and merging.

### Give AI sessions a conventions file
Keep an `AGENTS.md` (or `CLAUDE.md`) at repo root describing:
- The file size limit and ESLint enforcement
- The folder rules above (feature-first, banned filenames, barrel exports)
- Naming conventions
- Any project-specific gotchas (e.g. "wikilink resolution is case-insensitive," "never write directly to vault files outside `fs.rs` commands")

Point every new AI session at this file first so conventions don't have to be re-explained each time, and so different sessions stay consistent with each other.

---

## Git Hygiene

- Small, single-concern commits. Message describes the *why*, not just the *what* (`"add unresolved-link styling"` not `"update Editor.tsx"`).
- Never commit an AI-generated file you haven't opened and read.
- Feature branches per subsystem (`feat/wikilink-parser`, `feat/graph-view`), not one long-lived branch accumulating unrelated AI sessions.

## Testing

- Pure functions (parsers, graph builders) get unit tests — these are cheap to generate with AI and cheap to verify, and they're your safety net for regressions when AI touches this code again later.
- `parseLinks`, `buildGraph`, frontmatter parsing: all fully testable without Tauri/UI, prioritize these first.
- UI/integration tests come later; don't let missing UI test coverage block shipping the core.

## Documentation

- Every exported function gets a one-line JSDoc if its behavior isn't obvious from the name + types alone. Don't over-document trivial getters.
- Non-obvious *why* decisions (e.g. "SQLite FTS5 chosen over Tantivy because structured tag queries matter more than search ranking here") belong in code comments or the architecture doc — not left to be re-derived from git archaeology later.

---

## Quick Checklist Before Merging AI-Generated Code

- [ ] File under 250 lines?
- [ ] Single responsibility, correctly located (feature folder, not a dump file)?
- [ ] Types colocated, not dropped into a shared `types.ts`?
- [ ] File name matches primary export?
- [ ] Diff small enough that you actually read all of it?
- [ ] Commit scoped to one concern?
- [ ] Pure logic has a test?