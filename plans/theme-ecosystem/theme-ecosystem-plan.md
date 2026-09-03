# Theme Ecosystem — Feature Plan

## Goal

Let users create, publish, and install visual themes for DaVinci Notes —
pure CSS, no code execution, built on top of the existing design token
system. Modeled on the shape of Obsidian's theme system (a manifest +
stylesheet overriding exposed CSS custom properties, browsable in-app),
but our own token surface and our own registry.

**Assumption, stated per convention:** this shares registry
infrastructure and browser UI with the plugin ecosystem — one GitHub-
hosted registry repo, one in-app browser with two lists (Plugins /
Themes), rather than standing up separate infrastructure. Matches
Obsidian's own actual pattern (one Community browser, two tabs) and
avoids a second no-owned-backend setup for no real benefit. Flag in
Phase 4 below if this turns out to be the wrong call once actually
building against the plugin ecosystem's Phase 6 code.

Much lighter than the plugin ecosystem: no execution model, no
sandboxing, no permission enforcement, no lifecycle hooks. The real work
is Phase 1 — defining what's actually safe and stable to expose.

---

## Phase 1 — Public token surface + manifest format

This is the phase that matters most. Get this wrong and every published
theme breaks on your next design-system refactor.

- Audit the existing token system (`packages/design-system` or wherever
  it lives — check the project's actual structure) and classify every
  CSS custom property as either:
  - **Public/theme-overridable** — stable, documented, safe for third
    parties to target (e.g. background/text/accent color tokens)
  - **Internal** — implementation detail, not part of the theme contract,
    can change without notice
- Produce this classification as an actual reference doc — this doc *is*
  the API surface theme authors build against, same role the plugin
  API's TypeScript types played for plugin authors
- Define `manifest.json` for themes: `id`, `name`, `version`,
  `minAppVersion`, `author`, `description`, and a stylesheet entry
  (no `main`/entry-JS field — themes have no code)
- Decide on light vs. dark variant support in one theme package (Obsidian
  themes typically ship both) vs. requiring separate light/dark
  submissions — state which and why
- New package: `packages/theme-api` — manifest types + schema, plus the
  public-token reference doc, following the same conventions as
  `packages/plugin-api`

**Verification:** fixture manifests (valid, missing required field,
targeting a token that isn't in the public surface) — confirm schema
behavior for each, same rigor as the plugin manifest work.

---

## Phase 2 — Loader

- Discover theme folders/packages, validate manifest via Phase 1's schema
- Inject the theme's stylesheet, handle switching between themes cleanly
  — no flash of unstyled content, no leftover rules from a previously
  active theme bleeding into the new one
- Enable/disable in settings (parallel to how plugin enable/disable works
  in the existing plugin settings UI — reuse that UI pattern rather than
  inventing a new one)
- Only one theme active at a time (state explicitly if you decide to
  support layering multiple themes — that's a bigger scope increase and
  should be a deliberate choice, not a default)

**Verification:** switch between two real fixture themes repeatedly,
confirm no residual styles from the previous theme after each switch —
check actual computed styles, not just visual inspection. Disable the
active theme, confirm the app falls back to the default design-system
styling cleanly.

---

## Phase 3 — CSS safety review

Not a permission system — CSS doesn't need one — but worth a deliberate,
documented pass rather than skipping straight to "themes are just CSS,
ship it":

- Review what a theme's CSS can actually do beyond visual styling:
  `url()`-based network requests (fonts, background images) that could
  be used for tracking/fingerprinting, `@import` of external stylesheets,
  any CSS trick capable of exfiltrating content (rare, but worth a
  documented check rather than an assumption)
- Decide the policy: restrict/strip certain constructs at load time,
  or simply document the risk and rely on registry review (Phase 4) as
  the actual safety net — state which and why
- This is a short, documented decision, not a build-heavy phase

**Verification:** a fixture theme using each flagged construct (external
`url()`, `@import`), confirm the chosen policy is actually enforced or
correctly left unenforced-but-documented, whichever was decided.

---

## Phase 4 — Registry + browser UI integration

- If sharing infrastructure with the plugin ecosystem (this plan's stated
  assumption): extend the existing registry repo/format to hold a
  `themes` list alongside the `plugins` list, and add a Themes tab to the
  existing browser UI — reuse the install/update/uninstall flow's
  mechanics, swapping the plugin loader for the theme loader underneath
- If the shared-infrastructure assumption turns out wrong once looking
  at the actual Phase 6 (plugin) code: flag it here and propose the
  separate-infrastructure alternative instead, rather than forcing a bad
  fit
- Install: resolve latest compatible theme release respecting
  `minAppVersion`, download, validate manifest, install via Phase 2's
  loader — same principle as the plugin ecosystem's "don't build a
  second install path"

**Verification:** install/switch/uninstall a real fixture theme through
the browser UI, confirm it actually applies and the plugin ecosystem's
existing install flow wasn't broken by the shared-infrastructure changes.

---

## Phase 5 — Publishing tooling

- Sample theme template: manifest + stylesheet using only public tokens
  from Phase 1's reference doc, a README with dev workflow (local install
  via Phase 2's manual path) and publish steps (mirroring the plugin
  ecosystem's Phase 7 process against the shared registry)
- Optional: extend the plugin ecosystem's scaffolding CLI (if built) to
  also scaffold themes, rather than building a second CLI

**Verification:** build the template as a new theme author would,
following only the README, confirm it installs and applies correctly.

---

## Open items to resolve during Phase 1

- Exact package/repo location for the public-token reference doc
- Whether light/dark variants ship together or separately
- Final call on shared vs. separate registry infrastructure (default
  assumption: shared — see top of this doc)