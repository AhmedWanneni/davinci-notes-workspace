# Embed Web Pages Feature — Build Plan

Target: implement Obsidian-style web page embedding (per the "Embed web
pages" doc): raw `<iframe src="...">` embedding, YouTube video embeds via
the external-image `![](url)` syntax, and Twitter/X tweet embeds via the
same syntax. This is the feature explicitly deferred out of the HTML
Support plan — pick this up only after that plan's Phases 1–5 are closed
and stable, since this plan reuses its sanitizer, block-widget rendering,
and cursor-based source/render toggle patterns directly.

**This is a materially different risk class from the HTML Support plan.**
Sanitized `<div>`/`<span>`/`<table>` content is static — once sanitized, it
cannot execute code or make network requests on its own. An `<iframe>`
loads and runs an entire external, uncontrolled document — remote HTML,
CSS, and JavaScript, on every note view, potentially including trackers,
fingerprinting, or content that changes after the fact. This is not
something sanitization alone can neutralize; the mitigation here is
**sandboxing + explicit boundaries + deliberate opt-in**, not an allowlist
of "safe" iframe content the way Phase 1 of the HTML plan allowlisted safe
tags. Treat every phase in this plan as security-review-worthy, not just
Phase 1.

Read `AGENTS.md`, `DECISIONS.md`, `PROGRESS.md`, `PERFORMANCE.md` before
every session. Consult `DECISIONS.md` (the ADR index) only — do not read
the full `docs/adr/` directory; open a specific ADR only if the index
points to one directly relevant, and always open the HTML Support plan's
Phase 1 (sanitizer), Phase 2 (block widget + cursor toggle), and the
cursor-source-toggle fix ADRs before starting, since this plan builds
directly on top of that infrastructure rather than reimplementing it.

---

## Phase 1 — iframe Trust Model & Sandboxing Policy

**Goal**: decide, before writing any rendering code, exactly what an
embedded iframe is and isn't allowed to do. No rendering yet.

- Define the `sandbox` attribute policy applied to every embedded iframe,
  regardless of what the user wrote. Decide the minimum viable permission
  set (likely `allow-scripts` for interactive embeds like YouTube players,
  explicitly withholding `allow-same-origin` combined with `allow-scripts`
  where that combination would let embedded content escape the sandbox —
  research the specific known-dangerous `sandbox` attribute combinations
  before deciding, this is a real vulnerability class, not a formality).
  Log the chosen policy and rejected alternatives as an ADR.
- Define the `allow` attribute (Permissions Policy) handling: the doc's own
  example requests camera/microphone/autoplay-adjacent permissions
  (`accelerometer`, `autoplay`, `clipboard-write`, `encrypted-media`,
  `gyroscope`, `picture-in-picture`, `web-share`) — decide a safe subset
  this app will honor vs. strip, never trust the user-authored `allow`
  value directly. Camera/microphone access should very likely never be
  permitted regardless of what's in the source HTML. Log as an ADR.
- Decide `referrerpolicy` handling — default to something privacy-
  preserving (e.g. `strict-origin-when-cross-origin` or stricter) regardless
  of user input, since this is a local-first, privacy-conscious app per
  `AGENTS.md`'s framing.
- Decide URL scheme restrictions on `src`: only `http:`/`https:` — reject
  `file:`, `data:`, and anything else outright. Given this is a **Tauri
  desktop app**, also explicitly consider and block any `src` that could
  reach local network addresses or the app's own dev/internal servers
  (`localhost`, `127.0.0.1`, private IP ranges, `tauri://`, `asset://` or
  equivalent internal schemes) — an iframe is a way for note content to
  make requests, and on desktop that has a larger blast radius than in a
  browser tab. Log this threat model explicitly as an ADR; this is the
  single most important decision in this plan.
- Decide load behavior: eager-load on render (matches raw HTML/Obsidian
  behavior) vs. click-to-load placeholder (better for privacy — no request
  fires just from opening a note — and for performance on notes with many
  embeds). Given `AGENTS.md`'s performance principle and this app's
  local-first/privacy framing, lean toward click-to-load as the default
  and log the decision (and whether it's user-configurable) as an ADR.

**Checkpoint**: sandbox policy, allow-attribute policy, referrer policy,
URL scheme/host restrictions, and load-behavior default are all decided and
logged as ADRs, with rationale — no code written yet.

---

## Phase 2 — Raw `<iframe>` Detection & Rendering

**Goal**: `<iframe src="...">` in a note renders as a properly sandboxed
embed, reusing the HTML Support plan's existing infrastructure.

- Extend the sanitizer's allowlist (from the HTML plan's `@app/sanitize`
  package) to permit `<iframe>` specifically — but do not let the general
  sanitizer pass through arbitrary iframe attributes; apply Phase 1's
  policy at this layer: strip/rewrite `sandbox`, `allow`, and
  `referrerpolicy` to the app's fixed values regardless of source content,
  validate `src` against Phase 1's scheme/host rules and reject (or show a
  clear blocked-content message, not a silent failure) anything that fails
  - Extend, don't duplicate — this iframe policy layer is intentionally
    stricter than the general tag allowlist, so keep it as an explicit,
    separately-tested policy step, not folded silently into the same rules
    as `<div>`/`<span>` sanitization
- Reuse the HTML plan's block-widget rendering pattern (the corrected,
  proper CodeMirror block widget, not an inline decoration) and the
  cursor-based source/render toggle (cursor on the line shows raw
  `<iframe src="...">` source, cursor away shows the rendered embed) — do
  not reimplement either, import/extend the existing mechanism
- Implement Phase 1's click-to-load decision if that's what was chosen: a
  placeholder block widget (site name/URL, a "load embed" affordance) that
  only mounts the actual `<iframe>` element on explicit interaction
- Verify the doc's own example URL pattern works end-to-end (a YouTube
  embed URL via raw iframe), confirming sandboxing doesn't break normal
  playback for the legitimate case

**Checkpoint**: a raw `<iframe src="...">` block renders as a properly
sandboxed, policy-compliant embed (or click-to-load placeholder per Phase
1's decision); source/render cursor toggling and block-widget sizing work
identically to other HTML blocks; a `src` violating Phase 1's scheme/host
rules is rejected with a clear message, not silently broken or silently
allowed.

---

## Phase 3 — YouTube Embed via External-Image Syntax

**Goal**: `![](https://www.youtube.com/watch?v=...)` renders as an embedded
YouTube player, matching the doc's documented shorthand.

- Detect YouTube URL patterns specifically (`youtube.com/watch?v=`,
  `youtu.be/`, and any other canonical YouTube URL forms worth supporting)
  within the existing external-image syntax handler — this must not change
  behavior for any other external image URL, only intercept recognized
  YouTube patterns before they'd otherwise 404 as a broken image
- Convert the recognized URL into the actual embeddable YouTube iframe URL
  (`youtube.com/embed/VIDEO_ID`) and render through the exact same iframe
  rendering path built in Phase 2 (same sandboxing, same policy, same
  click-to-load behavior if applicable) — this is syntax sugar over Phase
  2's iframe embed, not a separate rendering path
- Confirm normal external images (`![](https://example.com/photo.png)`)
  are completely unaffected — add a regression test with a non-YouTube URL
  to confirm the detection doesn't over-match

**Checkpoint**: the doc's own YouTube example renders as a playable
embedded video through Phase 2's sandboxed iframe path; ordinary external
images continue to render as images, unaffected.

---

## Phase 4 — Tweet Embed via External-Image Syntax

**Goal**: `![](https://twitter.com/.../status/...)` renders as an embedded
tweet, matching the doc's documented shorthand.

- Detect Twitter/X status URL patterns within the same external-image
  syntax handler extended in Phase 3
- **This is the highest-risk piece of this entire plan and needs its own
  explicit decision, not an assumption**: Twitter's standard embed
  mechanism (`platform.twitter.com/widgets.js`) is a third-party script
  that executes arbitrary, Twitter-controlled JavaScript in the page —
  this is categorically different from an iframe's isolated document
  context and cannot be sandboxed the same way. Decide explicitly between:
  - (a) embedding via Twitter's oEmbed API inside a sandboxed `<iframe>`
    (if Twitter/X's oEmbed response supports iframe-based rendering
    without requiring the separate widgets.js script) — preferred if
    feasible, since it stays inside Phase 2's existing sandboxing model
  - (b) a simpler fallback: render a static card (author, text preview,
    link out to the tweet) built from oEmbed data without executing any
    third-party script at all — safer, less visually rich, likely
    preferable for a privacy-conscious local-first app
  - Do not silently load Twitter's `widgets.js` script into the app's own
    execution context without this being an explicit, logged, reviewed
    decision — that is a materially different trust boundary than
    anything else in this plan
  - Log the chosen approach and why as an ADR before implementing
- Any network request to fetch oEmbed data happens per Phase 1's
  load-behavior decision (eager vs. click-to-load) — a tweet embed
  fetching data on every note open has the same privacy/performance
  profile concern as an iframe and should follow the same default

**Checkpoint**: the doc's own tweet example renders using the approach
decided and logged above; the security tradeoff between iframe-based and
script-based embedding was made explicitly, not by default; normal
external images remain unaffected.

---

## Phase 5 — Regression & Integration Pass

**Goal**: confirm embeds compose correctly with the rest of the app and
don't regress anything from the HTML Support or formatting plans.

- Re-verify HTML Support plan's Phase 5 checkpoint still holds (attack-
  vector suite, no unsanitized render path) — this plan added a new,
  intentionally-permitted "escape hatch" (iframes) to that sanitizer, so
  re-confirm nothing else in the allowlist was accidentally loosened
  alongside it
- Confirm cursor navigation and source/render toggling work identically
  for iframe blocks as for other HTML blocks (reusing the earlier fix's
  mechanism, not a new one)
- Confirm YouTube/tweet embeds inside other block types (lists,
  blockquotes, tables) render correctly with no layout conflicts
- Performance check per `PERFORMANCE.md`: a note with several embeds
  should not degrade editor responsiveness — confirm click-to-load (if
  chosen) actually prevents eager network requests, and that scrolling
  past many embed placeholders is cheap
- If Canvas already exists in the app: confirm whether "add card from web
  page" is a small, natural extension of this plan's iframe embed or
  should be its own scoped follow-up — do not build it speculatively if
  Canvas doesn't exist yet or its card model isn't already defined
- Update `PROGRESS.md` with a closing summary, append full detail to
  `docs/HISTORY.md`, and log a final ADR indexing all decisions across
  Phases 1–5 (sandbox policy, allow-attribute policy, URL/host
  restrictions, load-behavior default, YouTube conversion rule, and the
  Twitter embedding approach and its rationale)

**Checkpoint**: full regression sweep passes; HTML Support plan's security
checkpoint re-confirmed; performance acceptable with multiple embeds; scope
decision on Canvas integration made explicitly (build or defer).

---

## What's Deliberately Out of Scope (unless flagged otherwise above)

- **Canvas "add cards from web pages"** — only in scope as a small
  extension if Canvas already exists and its card model is defined;
  otherwise a separate future plan.
- **Any embed provider beyond YouTube and Twitter/X** — the source doc
  only documents these two shorthand cases; other oEmbed providers are a
  deliberate future expansion, not implied scope here.
- **Executing third-party embed scripts (e.g. Twitter's widgets.js)
  without the explicit Phase 4 decision** — this must never happen as a
  default or convenience shortcut.

---

## Sequencing Notes

- Phase 1 is unusually load-bearing for this plan — more so than Phase 1
  was for the base HTML plan, because there's no allowlist that fully
  neutralizes an iframe's inherent capability the way sanitization
  neutralizes a `<div>`. Do not let time pressure compress this phase;
  every later phase inherits whatever policy gaps exist here.
- Phase 4 (Twitter) is the one phase in this entire plan (including the
  base HTML plan) that risks introducing arbitrary third-party JavaScript
  execution. If a session ever finds itself about to add
  `platform.twitter.com/widgets.js` as a `<script src>` without this
  having been the explicit, ADR-logged Phase 4 decision, stop — that is a
  scope violation, not a reasonable shortcut.
- This plan should not start until the HTML Support plan's Phase 5 is
  fully closed — it depends on that plan's sanitizer, block-widget
  pattern, and cursor-toggle fix being stable, not in-progress.