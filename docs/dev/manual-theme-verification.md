# Manual public-token verification

Start the desktop development app. In its DevTools console, toggle the
development-only stylesheet on:

```js
document.head.insertAdjacentHTML("beforeend", '<link id="public-token-test" rel="stylesheet" href="http://localhost:1420/_dev/theme-verification/magenta-public-tokens.css">');
```

Turn it off and restore the normal design system:

```js
document.querySelector("#public-token-test")?.remove();
```

The route exists only in Vite's `configureServer`; the stylesheet is under
`scripts/`, has no application import, and is excluded from production output.

Check with the sheet on, then off, including a light-to-dark-to-light theme
switch if theme packages are available:

- Settings: own backdrop only; focusable inputs and traffic controls.
- Search, Tags, and Command Palette: exactly one magenta scrim each.
- Canvas: text/file/link nodes, edges, groups, controls, context menu, nested
  canvas, and export overlay.
- Graph view: nodes, labels, edges, hover, and active node.
- Editor: headings, code blocks, blockquotes, links, wikilinks, tags,
  selection, and focus/cursor state.
- File tree, icon rail, tabs, right panels/backlinks/outline, status bar,
  settings forms, menus, modals, quick switcher, scrollbars, and focus rings.

For every surface, record whether it turns magenta/oversized, returns exactly
to baseline when disabled, and has no second backdrop or residual style.
