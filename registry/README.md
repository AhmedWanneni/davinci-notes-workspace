# DaVinci Notes Plugin and Theme Registry

This directory is the seed copy of the static catalog for the dedicated
`davinci-notes-plugins` GitHub repository. The published catalog is a JSON
file, not a service and contains no plugin code.

## Entry format

```json
{
  "id": "example-plugin",
  "name": "Example Plugin",
  "author": "Author",
  "description": "Short description",
  "repo": "https://github.com/author/example-plugin",
  "artifact": "example-plugin.zip"
}
```

The repository must publish a `versions.json` file mapping plugin versions to
minimum app versions and a GitHub Release for each version. The release asset
named by `artifact` is a zip containing the Phase 2 package layout.

Themes use the same entry shape and release resolution:

```json
{
  "id": "paper-dark",
  "name": "Paper Dark",
  "author": "Author",
  "description": "A restrained dark theme.",
  "repo": "https://github.com/author/paper-dark",
  "artifact": "paper-dark.zip"
}
```

The catalog has a `themes` array alongside `plugins`. A theme release ZIP
contains a root `manifest.json`, its declared `styles` CSS file, and optional
bundled assets. Theme manifests are validated against `@app/theme-api`; the
CSS safety policy in `docs/theme-css-safety.md` applies during review.

## Submission and validation

Authors open a pull request against `davinci-notes-plugins`, adding or
updating one entry. Lightweight CI validates unique IDs, HTTPS GitHub URLs,
SemVer version keys in `versions.json`, and that the referenced repository has
the expected release metadata and a valid manifest in its release artifact.
Human review approves ownership, description, and requested permissions.
The application treats the catalog as untrusted input and validates the
downloaded manifest again before installation.

For themes, CI also checks the theme stylesheet entry. Reviewers inspect
external `url()` resources, reject external `@import` by default, and look for
CSS state-encoding beacons before accepting an entry.
