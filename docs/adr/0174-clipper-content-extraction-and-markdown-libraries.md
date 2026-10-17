# ADR-0174: Content extraction and HTML→Markdown libraries

## Status

Accepted.
Defuddle core (`useAsync:false`) + Turndown + turndown-plugin-gfm implemented and verified. Measured output is 99.6 KB gzip (vs 218 KB for full defuddle).

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
- **Re-measured in Phase 2a (this repo, `gzip -9`):** Defuddle **core** bundle
  332,378 B raw / **97,372 B gzip**; `defuddle/full` 764,343 B raw / **218,493 B
  gzip**; core + `turndown` + `turndown-plugin-gfm` 345,614 B raw / **101,914 B
  gzip**. The real build confirms it: the whole popup chunk is 350,180 B raw /
  99,576 B gzip.
- **The core bundle cannot emit Markdown.** `contentMarkdown` and the
  `separateMarkdown` option appear only in `defuddle/dist/index.full.js`; neither
  appears in `defuddle/dist/index.js`. Core *does* still annotate MathML with
  `data-latex` and normalises `.admonition` into `data-callout`, which is what
  makes Option C viable.
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

### Option C — Defuddle core + Turndown for Markdown (adopted)

- Verified in Phase 2a: core has no Markdown converter, so this is not "two
  converters doing the same job" — it is the only way to get Markdown without the
  full bundle.
- Pros: ~116 KB gzip cheaper than Option A (101,914 vs 218,493 B gzip) while
  keeping Defuddle's extraction, metadata and normalisation. Core's `data-latex`
  and `data-callout` annotations let two small Turndown rules restore LaTeX math
  and Obsidian callouts (`apps/web-clipper/src/extraction/htmlToMarkdown.ts`).
- Cons: math and callouts are our own rules to keep correct. They are pinned by
  tests written against **real Defuddle output**, so an upgrade that changes the
  markup fails loudly instead of silently degrading clipped notes.

## Decision (revised in Phase 2a from measurement — still not accepted)

**Option C — Defuddle core for extraction, Turndown for Markdown** — keeping the
original hard conditions:

1. **Pin** the Defuddle version; keep it behind the extraction adapter
   (`apps/web-clipper/src/extraction/extractArticle.ts`) so it can be swapped
   without touching the popup.
2. Call it with **`useAsync: false`** *and* the synchronous `parse()` — never
   `parseAsync()`. No third-party API is ever contacted on a clip's behalf.
3. Markdown comes from our own Turndown conversion of `result.content`
   (`htmlToMarkdown.ts`), including the `data-latex` and `data-callout` rules.
4. Sanitize the extracted HTML with a clip-specific DOMPurify policy before it is
   rendered in the popup (Phase 2b, when the preview exists).
5. Because the cost is real, **surface it explicitly** in the Phase 2 PR
   description (PERFORMANCE.md rule 1) — see "Performance cost".

Option A (previously recommended) is **rejected on measurement**: the Markdown
converter lives in `defuddle/full`, which costs 218,493 B gzip, i.e. ~114 KB gzip
more than Option C for the same extraction. Option B remains the fallback only if
Defuddle's *extraction* quality itself disappoints.

The condition that used to gate this choice — "verify the core bundle cannot emit
Markdown" — is met, as recorded in Context.

## Consequences

- Output parity with the reference for math/footnotes/code/callouts is achieved
  cheaply in engineering time, at ~86 KB gzip in an extension bundle.
- The extraction library is a WIP: pinning plus extraction fixtures per upgrade
  are mandatory, not optional.
- `useAsync:false` is a correctness/security requirement, not a preference.

## Performance cost (measured)

- **99,576 B gzip** for the popup chunk, which contains Defuddle + Turndown +
  turndown-plugin-gfm (~100 KB gzip); background service worker 507 B gzip.
- **Zero cost on normal page loads:** no content script, no host permission and no
  fetch until the user invokes the clipper (PERFORMANCE.md rule 4). Turndown is
  also only constructed on the first conversion.
- Option B (Readability + Turndown) would be ~16 KB gzip and stays recorded as the
  fallback.
- No desktop/app bundle impact.

## Open decisions

- O2 (still open, restated with measured figures): accept **~100 KB gzip** (core
  Defuddle + Turndown: reference-parity extraction plus our own math/callout
  rules), or aim for **~16 KB gzip** with Readability + Turndown and accept
  re-implementing the extraction normalisation. Option A (full Defuddle, 218 KB
  gzip, includes its own Markdown converter) is measured out.
