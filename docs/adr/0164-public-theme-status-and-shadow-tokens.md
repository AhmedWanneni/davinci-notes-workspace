# ADR-0164: Public theme status-tint and shadow tokens

## Status

Accepted

## Context

The public theme contract has readable status text tokens but no way to theme
the translucent surfaces used by `Badge`. The existing Badge variants are
accent, success, warning, and error; there is no info variant or info text
token elsewhere in the design system. The current computed-equivalent values
are 15% and 30% alpha versions of their status colors:

| Variant | Background | Border |
|---|---|---|
| Accent | `rgb(127 109 242 / 15%)` | `rgb(127 109 242 / 30%)` |
| Success | `rgb(46 204 113 / 15%)` | `rgb(46 204 113 / 30%)` |
| Warning | `rgb(241 196 15 / 15%)` | `rgb(241 196 15 / 30%)` |
| Error | `rgb(229 83 83 / 15%)` | `rgb(229 83 83 / 30%)` |

Dialog, dropdown, and tooltip also use black elevation shadows. Their current
computed layer colors are: Dialog `rgb(0 0 0 / 35%)` and `rgb(0 0 0 / 20%)`;
Dropdown and Tooltip `rgb(0 0 0 / 10%)` and `rgb(0 0 0 / 6%)`.

## Proposed decision

Add eight public, full CSS-color tokens:

- `--color-bg-status-accent`, `--color-border-status-accent`
- `--color-bg-status-success`, `--color-border-status-success`
- `--color-bg-status-warning`, `--color-border-status-warning`
- `--color-bg-status-error`, `--color-border-status-error`

Their defaults are the corresponding values in the table. The `status` term
keeps these semantic tinted surfaces distinct from ordinary backgrounds and
borders while matching the existing `--color-bg-*` and `--color-border-*`
naming convention. No info tokens are added because no existing variant or
text semantic requires them.

Add one public `--color-shadow` token with default `rgb(0 0 0)`. It carries
only the opaque base color, not a final alpha-bearing shadow. Dialog,
DropdownMenu, and Tooltip each retain their own existing per-layer alpha by
mixing this token with `transparent`; theme authors therefore set one color,
not four shadow values. A single shared token covers all three consumers and
lets a flat theme set it to `transparent`.

`color-mix()` is not the sole compatibility path. The app currently declares
no Windows `minimumWebview2Version`, Tauri uses the OS WebKit on macOS, and
Linux WebKitGTK varies by distribution. Each shadow keeps its existing plain
`rgb()` fallback layer, then applies the token-derived `color-mix()` form in
an `@supports` block. Unsupported webviews preserve the default visual;
supported webviews make the shadow theme-overridable.

## Consequences

The public theme contract grows by nine semantic tokens. This is preferable
to raw component colors: status treatments remain legible in light themes,
and elevation remains a deliberate theme choice rather than an immutable
black assumption. No dependency or runtime work is required.
