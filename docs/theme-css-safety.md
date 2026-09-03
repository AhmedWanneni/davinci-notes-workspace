# Theme CSS Safety Decision

Status: accepted for Theme Ecosystem Phase 3. This is a review policy, not a
permission system and not a CSS sanitizer.

## Boundary

Phase 2 validates the JSON manifest, reads the declared stylesheet, and puts
its text in one host-owned `<style data-davinci-theme="...">` element. It does
not parse, rewrite, or sanitize CSS. A local theme is therefore trusted as
part of the user's local installation, while a registry theme must pass the
review described below before approval.

This keeps theme activation lightweight: no parser dependency, no stylesheet
rewrite on the foreground switch path, and no extra network request caused by
the loader itself.

## Decisions

### External `url()` resources: document and review

Do not reject or strip `url()` in Phase 3. CSS URLs can request fonts,
background images, and other resources. A registry reviewer must reject
tracking URLs, unique query strings, and unnecessary third-party hosts. Local
or bundled assets and intentionally documented font hosts may be accepted,
but the author must identify them in the submission.

The tradeoff is deliberate: blocking every non-data URL would remove useful
font and image use cases, while a regex-based filter would be easy to bypass
with CSS syntax and would not provide a reliable local asset base for the
current injected `<style>` implementation. Phase 4 registry review is the
actual safety gate for distributed themes.

### External `@import`: document and review, with a stronger presumption

Do not rewrite or reject imports in the local loader. Registry review should
reject external `@import` by default. An import makes the rendered CSS mutable
after approval and can introduce additional network requests without a new
theme release. A reviewer may approve a clearly justified, pinned resource,
but a theme should normally bundle its CSS instead.

### CSS-only exfiltration: document and review

CSS selectors can conditionally request URLs based on DOM state, including
attribute presence. The app DOM contains useful metadata such as note paths,
ARIA labels, and editor structure, so this is not impossible. However, CSS
cannot read arbitrary text values or execute script, and the main sensitive
note content is rendered through CodeMirror text nodes rather than a broad
attribute data store. The practical risk is lower than plugin code or an
external stylesheet, but it is not zero.

Registry reviewers should reject selectors aimed at sensitive application
metadata, URL beacons whose requests encode state, and CSS that targets
internal implementation details as a data channel. No load-time heuristic is
added because it would be both brittle and easy to evade.

## Phase 4 review checklist

- Inspect every `url()` and record its host and purpose.
- Reject unexplained external URLs, unique identifiers, and external fonts or
  images that are not necessary for the theme.
- Reject external `@import`; prefer bundled CSS.
- Search selectors and URL query strings for attempts to encode DOM state.
- Re-review all external resources when a theme version changes.

This policy must be revisited if registry review is not operating before
remote themes are made available. A future CSP or asset-packaging decision
would supersede this document rather than silently changing Phase 2 loader
behavior.
