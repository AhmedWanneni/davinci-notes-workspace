# @app/theme-api

This package defines the CSS-only DaVinci Notes theme manifest and the public
token contract. It has no runtime loader, registry integration, or dependency
on `apps/*`.

## Theme manifest

```json
{
  "id": "paper-light",
  "name": "Paper Light",
  "version": "1.0.0",
  "minAppVersion": "0.1.0",
  "author": "Theme Author",
  "description": "A calm paper-inspired theme.",
  "styles": "theme.css"
}
```

`styles` is one relative CSS path. A package supports both light and dark
variants in that stylesheet using normal selectors and media queries such as
`@media (prefers-color-scheme: dark)`. Separate submissions per variant would
duplicate metadata and force the later loader/registry to treat variants as
unrelated themes; one package keeps a theme identity and version together.

See [PUBLIC_TOKENS.md](./PUBLIC_TOKENS.md) for the complete audit and stable
CSS variable contract. The schema is [themeManifest.schema.json](./themeManifest.schema.json),
and `validateThemeManifest` provides the dependency-free runtime checks later
loaders can reuse.
