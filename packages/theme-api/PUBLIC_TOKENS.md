# DaVinci Notes Theme Token Contract

This document is the Phase 1 public CSS contract for themes. A theme may
override the public variables below from its stylesheet. Names not listed here
are internal or accidental implementation details and are not supported.
The defaults are the current generated values from
`packages/design-system/tokens/dist/variables.css`.

## Public tokens

### Surfaces and interaction

| Token | Controls | Current default |
|---|---|---|
| `--color-bg-primary` | Main application and editor surface | `#1e1e1e` |
| `--color-bg-primary-alt` | Alternate primary surface | `#161616` |
| `--color-bg-secondary` | Panels, cards, and controls | `#262626` |
| `--color-bg-secondary-alt` | Alternate panel surface | `#202020` |
| `--color-bg-hover` | Hover background state | `rgba(255, 255, 255, 0.05)` |
| `--color-bg-active` | Active/pressed background state | `rgba(255, 255, 255, 0.08)` |
| `--color-interactive-accent` | Primary interactive color | `#7f6df2` |
| `--color-interactive-accent-hover` | Hovered primary interactive color | `#8d7cf4` |
| `--color-interactive-accent-active` | Pressed primary interactive color | `#6c5ce7` |

### Text and status

| Token | Controls | Current default |
|---|---|---|
| `--color-text-normal` | Normal readable text | `#dcddde` |
| `--color-text-muted` | Secondary and supporting text | `#888888` |
| `--color-text-faint` | Lowest-emphasis text | `#555555` |
| `--color-text-accent` | Accent links and highlighted text | `#7f6df2` |
| `--color-text-on-accent` | Text placed on accent backgrounds | `#ffffff` |
| `--color-text-error` | Error and destructive status text | `#e55353` |
| `--color-text-success` | Successful status text | `#2ecc71` |
| `--color-text-warning` | Warning status text | `#f1c40f` |

### Borders

| Token | Controls | Current default |
|---|---|---|
| `--color-border-subtle` | Low-emphasis separators and outlines | `#2e2e2e` |
| `--color-border-normal` | Standard component borders | `#363636` |
| `--color-border-focus` | Keyboard focus and active focus ring | `#7f6df2` |
| `--border-width-thin` | Standard border width | `1px` |
| `--border-width-thick` | Emphasized border and focus width | `2px` |
| `--border-radius-none` | Square corners | `0px` |
| `--border-radius-sm` | Small component corner radius | `2px` |
| `--border-radius-md` | Standard component corner radius | `4px` |
| `--border-radius-lg` | Dialog and large surface corner radius | `6px` |

### Spacing

| Token | Controls | Current default |
|---|---|---|
| `--space-1` | Smallest spacing increment | `4px` |
| `--space-2` | Compact control spacing | `8px` |
| `--space-3` | Standard compact spacing | `12px` |
| `--space-4` | Standard component spacing | `16px` |
| `--space-6` | Large section spacing | `24px` |
| `--space-8` | Extra-large section spacing | `32px` |

### Typography

| Token | Controls | Current default |
|---|---|---|
| `--font-ui` | Application interface font stack | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` |
| `--font-editor` | Editor and code font stack | `'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, 'Courier New', monospace` |
| `--type-scale-xs` | Extra-small text size | `0.75rem` |
| `--type-scale-sm` | Small text size | `0.875rem` |
| `--type-scale-base` | Base text size | `1rem` |
| `--type-scale-lg` | Large text size | `1.25rem` |
| `--type-scale-xl` | Extra-large text size | `1.5rem` |
| `--type-scale-2xl` | Display text size | `2rem` |
| `--type-weight-regular` | Regular text weight | `400` |
| `--type-weight-medium` | Medium text weight | `500` |
| `--type-weight-semibold` | Semibold heading/control weight | `600` |
| `--type-weight-bold` | Bold emphasis weight | `700` |
| `--type-leading-tight` | Tight heading line height | `1.2` |
| `--type-leading-normal` | Standard line height | `1.5` |
| `--type-leading-relaxed` | Relaxed reading line height | `1.75` |

### Icon sizing

| Token | Controls | Current default |
|---|---|---|
| `--icon-size-xs` | Extra-small icon box | `12px` |
| `--icon-size-sm` | Small icon box | `14px` |
| `--icon-size-md` | Standard icon box | `16px` |
| `--icon-size-lg` | Large icon box | `20px` |
| `--icon-size-xl` | Extra-large icon box | `24px` |

## Internal tokens

These are declared in the current generated file but are excluded from the
theme contract:

| Token | Reason |
|---|---|
| `--icon-weight-default` | Its values (`regular`) are coupled to the current icon library. |
| `--icon-weight-active` | Its values (`fill`) are coupled to the current icon library. |
| `--motion-duration-fast` | Timing affects interaction behavior and performance, not theme identity. |
| `--motion-duration-base` | Timing affects interaction behavior and performance, not theme identity. |
| `--motion-duration-slow` | Timing affects interaction behavior and performance, not theme identity. |
| `--motion-ease-standard` | Easing is an implementation detail of component transitions. |

Themes should use `prefers-reduced-motion` in their own stylesheet if they
need additional accessibility behavior. A future motion contract can be
considered separately without making current component timing a stable API.

## Audit findings before Phase 2

The generated token set is not the complete set of variables used by the
application. These aliases occur in app/canvas styles but have no declaration
in the design-system token source: `--color-accent`, `--color-border`,
`--color-border-default`, `--color-border-strong`, `--color-overlay`,
`--color-text-primary`, `--color-text-secondary`, `--edge-color`,
`--font-mono`, `--font-size-2xs`, `--radius-xs`, `--radius-sm`,
`--radius-md`, `--space-12`, `--type-body`, `--type-heading-3`, and
`--type-size-sm`.

Several represent the same visual concepts with competing names:

- `color-text-primary`/`secondary` overlap `color-text-normal`/`muted`.
- `color-border`/`default`/`strong` overlap `color-border-subtle`/`normal`.
- `color-accent` overlaps the interactive and text accent tokens.
- `radius-*` overlaps `border-radius-*`.
- `font-mono` overlaps `font-editor`.

Fallback values in canvas styles also disagree for the same concepts. These
are flagged rather than exposed as public aliases. Phase 2 should reconcile
or remove them before promising theme behavior across the whole application.
The fixture `fixtures/internal-token-theme/styles.css` deliberately targets
`--motion-duration-fast`; it is valid CSS but outside this contract and is a
concrete candidate for a future warning/lint rule.
