# Design System — Implementation Plan

Stack: **SCSS + PostCSS**, component-driven, documented in **Storybook**, tested at the component level. Built to serve an editorial/Swiss-influenced visual direction — flat depth via borders, typography-driven hierarchy, no gradients/shadows/glassmorphism.

---

## Phase 0 — Tooling Setup

- [ ] PostCSS pipeline: `postcss-preset-env` (modern CSS features with fallback), `autoprefixer`, `postcss-scss` if needed for interop.
- [ ] SCSS compiled through Vite's built-in SCSS support (or `sass` directly), post-processed by PostCSS.
- [ ] Stylelint configured with a token-enforcing ruleset (see Phase 2) so raw hex/px values outside the token layer fail lint, not just convention.
- [ ] Storybook installed (`@storybook/react-vite`), configured to read the same PostCSS/SCSS pipeline as the app — stories must render identically to production.
- [ ] Testing: `@storybook/test` (interaction tests) + `vitest` for unit-level component logic. Visual regression via `Chromatic` or `@storybook/test-runner` + `playwright` screenshots (pick one — Chromatic is faster to set up, self-hosted Playwright is free).

```
design-system/
├── tokens/
├── primitives/       # unstyled behavior (Button, Input logic) if needed
├── components/
├── patterns/          # composed multi-component patterns
├── styles/
│   ├── _reset.scss
│   ├── _mixins.scss
│   └── _global.scss
└── .storybook/
```

---

## Phase 1 — Design Tokens (the foundation, do this first)

Tokens are the single source of truth. Every component pulls from these — no hardcoded values anywhere else in the system.

```scss
// tokens/_color.scss
$color-ink:        #111111;
$color-paper:       #f8f7f4;
$color-border:      #1a1a1a;
$color-accent:      #___;   // pick deliberately, sparingly

// tokens/_type.scss
$font-display: "___", serif;      // editorial headline face
$font-body:     "___", sans-serif;
$font-mono:     "___", monospace;  // for the typographic "details" you mentioned

$type-scale: (
  "xs":  0.75rem,
  "sm":  0.875rem,
  "base": 1rem,
  "lg":   1.25rem,
  "xl":   1.75rem,
  "2xl":  2.5rem,
  "3xl":  4rem
);

// tokens/_space.scss
$space-unit: 8px;
// scale as multiples: $space-1: $space-unit, $space-2: $space-unit * 2, etc.

// tokens/_border.scss
$border-width: 1px;
$border-style: solid;
// depth expressed via border weight/color shift, never box-shadow

// tokens/_motion.scss
$ease-standard: cubic-bezier(...);
$duration-fast: 120ms;
$duration-base: 200ms;
```

- [ ] Define color, type scale, spacing scale, border system, motion tokens.
- [ ] Export tokens as SCSS maps **and** CSS custom properties (`:root { --color-ink: ... }`) — SCSS vars for compile-time, CSS vars for runtime theming (dark mode, future theme variants) without a rebuild.
- [ ] Stylelint rule: disallow raw color/px values outside `tokens/` — force every component to reference a token.

---

## Phase 2 — Base / Reset Layer

- [ ] CSS reset (modern reset — box-sizing, margin removal, etc.)
- [ ] Global typographic defaults (base font, line-height, heading scale mapped to `$type-scale`)
- [ ] `_mixins.scss`: reusable patterns —
  - border-depth mixin (replaces shadow-based elevation)
  - focus-visible treatment (accessible, on-brand — not browser default blue outline)
  - responsive breakpoint mixin

---

## Phase 3 — Primitive Components

Build in dependency order — later components consume earlier ones.

1. **Typography** (`Text`, `Heading`) — every type-scale value used through these, never raw `font-size` in a component.
2. **Button**
3. **Input / Textarea**
4. **Checkbox / Radio / Toggle**
5. **Divider / Border** (given the border-as-depth approach, this is a first-class primitive, not an afterthought)
6. **Badge / Tag**
7. **Tooltip**

Each component:
```
components/Button/
├── Button.tsx
├── Button.module.scss
├── Button.stories.tsx
├── Button.test.tsx
└── index.ts
```

- [ ] Component-level SCSS uses CSS Modules (colocated, scoped, no global leakage) and only ever references tokens, never raw values.
- [ ] Every primitive gets a Storybook story with **all variants and states** (default, hover, focus, disabled, error) as separate story exports — this becomes your visual QA surface.
- [ ] Every primitive gets an interaction test (`@storybook/test`) for keyboard nav + basic a11y (focus order, aria attributes where relevant).

---

## Phase 4 — Composed / Pattern Components

App-specific, built from primitives:
- File tree item
- Sidebar section
- Command palette row
- Graph node tooltip
- Editor toolbar

- [ ] Same file structure as primitives (component + scss module + stories + test).
- [ ] Stories here should show the component in realistic context (not isolated) — use Storybook's `decorators` to wrap with representative surrounding layout.

---

## Phase 5 — Documentation Layer

- [ ] Storybook "Docs" pages auto-generated from component prop types (TSDoc comments on props feed directly into Storybook autodocs — write these as you build, not retroactively).
- [ ] A dedicated "Foundations" section in Storybook: token reference pages (color swatches, type scale specimen, spacing scale visualization) so tokens are browsable, not just defined in code.
- [ ] A short `DESIGN_PRINCIPLES.md` alongside the system: the rules you already articulated (no gradients, no shadows, no glassmorphism, no pill badges, no blob illustrations, borders for depth, asymmetric layout is allowed/encouraged) — this is what keeps AI-generated components on-brand. Point every AI session building a new component at this file.

---

## Phase 6 — Testing Strategy

| Layer | Tool | What it catches |
|---|---|---|
| Unit (logic) | Vitest | Component logic, prop handling, edge cases |
| Interaction | `@storybook/test` (play functions) | Click/keyboard flows, focus management |
| Visual regression | Chromatic or Playwright screenshots | Unintended style drift — critical given how deliberate the aesthetic is |
| Accessibility | `@storybook/addon-a11y` | Contrast, aria, focus order — runs directly in Storybook |

- [ ] Visual regression is the highest-value test type for a design system this opinionated — a single AI-generated change that reintroduces a shadow or a gradient should fail CI, not get caught in review.
- [ ] Run visual regression on every primitive + pattern story, gated in CI on PRs touching `components/` or `tokens/`.

---

## Phase 7 — CI Integration

- [ ] Stylelint + ESLint run on every PR.
- [ ] Storybook build must succeed on every PR (catches broken stories early).
- [ ] Visual regression suite runs on PRs touching design-system paths, blocks merge on unreviewed diffs.
- [ ] Publish Storybook as a static build (Chromatic hosting, or Vercel/Netlify preview) so it's reviewable without pulling the branch locally.

---

## Suggested Build Order

1. Tokens (Phase 1) — everything depends on this, don't skip ahead.
2. Reset + mixins (Phase 2).
3. Typography primitive first — validates the type scale against real content immediately.
4. Remaining primitives (Button → Input → Divider → Badge → Tooltip), each with stories + tests before moving to the next.
5. Stylelint token-enforcement rule turned on **once tokens are stable** — earlier and it'll just get in your way while you're still deciding values.
6. Composed patterns, only after primitives are stable — changing a primitive after patterns are built means touching every consumer.
7. Visual regression baseline captured once the first full primitive set is done — this becomes your drift-detection floor.

---

## Guardrails for AI-Generated Components

- New component request → point the session at `DESIGN_PRINCIPLES.md` + `tokens/` first, every time.
- No raw hex/px in generated SCSS — Stylelint should catch this automatically, but review anyway.
- Every generated component ships with its story and test in the same PR — no story-less components merged, ever (this is usually the first thing that gets skipped under time pressure, and it's the thing that makes the system rot).