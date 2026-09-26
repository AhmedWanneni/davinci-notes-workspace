# DaVinci Notes built-in themes

These four CSS-only packages are bundled with the desktop app:

- Light A
- Catppuccin Latte
- Catppuccin Frappé
- Dark B

Only theme metadata is in the initial frontend module. Each stylesheet is a
Vite `?raw` dynamic-import chunk and is fetched only when that theme becomes
active. The active built-in stylesheet is cached in app-level local storage so
it can be synchronously restored before the first React render; no vault or
network access is required.

Themes may override only tokens in `packages/theme-api/PUBLIC_TOKENS.md`.
The Catppuccin palettes are adapted from the official
[Catppuccin palette](https://github.com/catppuccin/palette), licensed MIT;
their individual package directories include the attribution and license note.
