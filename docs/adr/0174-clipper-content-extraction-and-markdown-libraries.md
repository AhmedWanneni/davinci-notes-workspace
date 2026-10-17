# ADR-0174: Content extraction and HTML→Markdown libraries

## Status

Proposed (needs owner input, see "Open decisions"). Draft only; no code.

Sizes below are from bundlephobia at the time of writing (min+gzip) and must be
re-verified in Phase 0 before adoption.

## Context

The clipper needs two capabilities: (a) extract the main article from a page,
stripping nav/ads/comments; (b) convert that to clean Markdown with headings,
lists, tables, code blocks, math, footnotes, images and citations. Both must run
inside the extension's content script (it has the live DOM and any Schema.org
JSON-LD) and must be invoked only on demand (PERFORMANCE.md rule 4).

Verified facts:
- **Defuddle** (kepano/defuddle, MIT — LICENSE confirms MIT, © 2025 Steph Ango):
  "created for … Obsidian Web Clipper", described as "very much a work in
  progress", 9.7k stars, 775 commits. `obsidian-clipper`'s `package.json` lists
  `defuddle ^0.19.2`; bundlephobia reports `defuddle` 0.19.5 at **310 KB / 86.4 KB
  gzip, 2 dependencies**. Its documented output covers HTML or Markdown, metadata
  (`author`, `title`, `description`, `domain`, `favicon`, `image`, `language`,
  `published`, `site`, `wordCount`, `metaTags`, `schemaOrgData`), and it
  standardizes footnotes, code blocks (language retained), math (MathML), and
  callouts. Its full bundle adds math and Markdown via `mathml-to-latex` +
  `temml`. It offers `useAsync` (default `true`) which may fetch from the
  FxTwitter third-party API for SPAs — must be disabled for us.
- **@mozilla/readability** 0.6.0: **33.8 KB / 11.2 KB gzip, 0 dependencies**,
  Apache-2.0 (per its README license section). Extraction only — returns cleaned
  HTML plus metadata; **no** Markdown conversion. Its README explicitly warns it
  does not sanitize and recommends DOMPurify for untrusted input.
- **Turndown** 7.2.4: **10.8 KB / 4.1 KB gzip, 1 dependency**, MIT. HTML→Markdown
  only — no extraction. GFM extras (tables, strikethrough, task lists) are a
  separate plugin, `turndown-plugin-gfm` **2.06 KB / 0.95 KB gzip**.
- `@app/sanitize` already ships DOMPurify with a strict allowlist (ADR-0089/0090);
  that allowlist is designed for the editor's literal HTML ranges, not for
  arbitrary page HTML, so a clip-specific sanitize step is still required.

## Options

### Option A — Defuddle (core bundle) for extraction + Markdown

- Pros: one dependency; this is the library the reference uses, so output shape
  (footnotes, code language, callouts, metadata, Schema.org) matches user
  expectations without us re-implementing normalization; MIT; actively released.
- Cons: largest single cost (~86 KB gzip); explicitly WIP; 2 transitive
  dependencies; its async extractors reach a third-party API by default.

### Option B — Readability + Turndown + turndown-plugin-gfm

- Pros: ~16 KB gzip total, both mature, permissive licenses.
- Cons: two libraries plus glue; no math, no footnote/callout standardisation, no
  Schema.org helper; we would re-implement the normalization that produces the
  reference's output quality — the expensive part.

### Option C — Defuddle core + Turndown for Markdown

- Cons: overlaps two converters; Defuddle already converts. Rejected unless the
  Phase 0 spike shows Defuddle's core bundle cannot emit Markdown in-browser
  (the README implies the full bundle owns Markdown conversion — this must be
  verified, it changes the cost).

## Decision (recommended)

**Option A**, with hard conditions:

1. **Pin** the Defuddle version; keep it behind `packages/clipper-core` /
   extraction adapter so it can be swapped without touching UI.
2. Call it with **`useAsync: false`** — no third-party API is ever contacted.
3. Sanitize the extracted HTML with a clip-specific DOMPurify policy (reuse the
   `@app/sanitize` dependency, not necessarily its editor allowlist) before any
   of it is rendered in the popup.
4. Re-verify in Phase 0: the exact sub-bundle needed for Markdown, its real
   transitive deps, and the license file — and record the measured size.
5. Because the cost is real, **surface it explicitly** in the Phase 2 PR
   description (PERFORMANCE.md rule 1).

If Phase 0 finds the Markdown path requires the much heavier full bundle without
a tree-shakeable split, fall back to Option B and accept re-implementing
normalization.

## Consequences

- Output parity with the reference for math/footnotes/code/callouts is achieved
  cheaply in engineering time, at ~86 KB gzip in an extension bundle.
- The extraction library is a WIP: pinning plus extraction fixtures per upgrade
  are mandatory, not optional.
- `useAsync:false` is a correctness/security requirement, not a preference.

## Performance cost

- ~86.4 KB gzip in the extension's on-invoke content script; **zero** cost on
  normal page loads because the script is not injected until the user invokes the
  clipper (PERFORMANCE.md rule 4). Alternative Option B is ~16.9 KB gzip.
- No desktop/app bundle impact.

## Open decisions

- O2: accept ~86 KB gzip for reference-parity extraction, or ~17 KB gzip with
  more custom normalization work.
