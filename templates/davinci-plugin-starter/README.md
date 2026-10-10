# DaVinci Notes Plugin Starter

This is a minimal working TypeScript plugin using the current async RPC API.
It registers a declarative status view and a command that writes/reads a vault
file, persists a small plugin-data record, then reads the active editor
snapshot asynchronously. It requests only the capabilities used by that
example.

## Local development

Requirements: Node.js 22 or newer and a DaVinci Notes desktop checkout with
the plugin loader available.

1. Install the template dependencies and build the package:

   ```sh
   npm install
   npm run build
   ```

2. Copy the contents of `dist/` into the app's manual plugin directory:
   `<vault>/.davinci/plugins/sample-vault-command/`. The directory name must
   match `manifest.json`'s `id`.

3. Open or restart DaVinci Notes. In Settings > Plugins, enable **Sample
   Vault Command** and approve its three declared permissions.

4. Open a Markdown note, enable **Sample Vault Command**, then run
   **Sample: write and read a vault file** from the Command Palette or use the
host-rendered view button. The command creates `Sample Vault Command.md`,
verifies the vault/storage round-trip, and logs the async editor snapshot.

The generated `dist/` directory is the installable package directory. The
registry later expects the same files in a ZIP release asset.

## Publish a release

The registry process is the one documented in the
[DaVinci Notes plugin registry](https://github.com/AhmedWanneni/davinci-notes-plugins).

1. Change the plugin `version` in `manifest.json`, add the same version key
   to `versions.json`, and set its value to the minimum compatible app
   version. Keep every historical version entry.
2. Run `npm run build` and verify `dist/manifest.json` and `dist/main.js`.
3. Create a GitHub Release tagged `v<plugin-version>` in the author's plugin
   repository. Attach a ZIP named `sample-vault-command.zip` whose root
   contains the files from `dist/` (`manifest.json`, `main.js`, and
   `versions.json`).
4. Open a pull request against `AhmedWanneni/davinci-notes-plugins`, adding
   or updating one object in `plugins.json` with `id`, `name`, `author`,
   `description`, the HTTPS GitHub `repo`, and `artifact` when the ZIP name
   is not the default `<id>.zip`.
5. The registry CI validates JSON shape, unique IDs, HTTPS GitHub URLs, and
   each referenced repository's `versions.json`. Maintainers review
   ownership, description, release metadata, and requested permissions
   before merging. DaVinci Notes validates the downloaded manifest again at
   install time.

No runtime dependency is bundled. The host injects `DavinciPlugin`; the
local `src/host-api.d.ts` exists only to type-check the demonstrated API.
