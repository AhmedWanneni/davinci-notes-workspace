# DaVinci Notes Plugin Registry

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

## Submission and validation

Authors open a pull request against `davinci-notes-plugins`, adding or
updating one entry. Lightweight CI validates unique IDs, HTTPS GitHub URLs,
SemVer version keys in `versions.json`, and that the referenced repository has
the expected release metadata and a valid manifest in its release artifact.
Human review approves ownership, description, and requested permissions.
The application treats the catalog as untrusted input and validates the
downloaded manifest again before installation.
