#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

DRY_RUN=false
TARGET_INPUT=""

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=true
      ;;
    -*)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
    *)
      if [[ -z "$TARGET_INPUT" ]]; then
        TARGET_INPUT="$arg"
      else
        echo "Unexpected extra argument: $arg" >&2
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$TARGET_INPUT" ]]; then
  echo "Usage: $0 [--dry-run] <patch|minor|major|X.Y.Z|X.Y.Z-pre.N>" >&2
  exit 1
fi

ROOT_PKG="${REPO_ROOT}/package.json"
CURRENT_VERSION="$(node -e "const pkg=require('$ROOT_PKG'); console.log(pkg.version);")"

# Compute new version using Node semver logic
NEW_VERSION="$(node -e "
  const current = '$CURRENT_VERSION';
  const input = '$TARGET_INPUT';
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

  if (['patch', 'minor', 'major'].includes(input)) {
    const match = current.match(semverRegex);
    if (!match) {
      console.error('Invalid current version:', current);
      process.exit(1);
    }
    let [_, maj, min, pat] = match;
    maj = parseInt(maj, 10);
    min = parseInt(min, 10);
    pat = parseInt(pat, 10);
    if (input === 'major') { maj += 1; min = 0; pat = 0; }
    else if (input === 'minor') { min += 1; pat = 0; }
    else if (input === 'patch') { pat += 1; }
    console.log(\`\${maj}.\${min}.\${pat}\`);
  } else {
    // Strip leading 'v' if provided
    const clean = input.startsWith('v') ? input.slice(1) : input;
    if (!semverRegex.test(clean)) {
      console.error('Invalid SemVer version string:', input);
      process.exit(1);
    }
    console.log(clean);
  }
")"

echo "Current version: $CURRENT_VERSION"
echo "Target version:  $NEW_VERSION"

if [[ "$DRY_RUN" == "true" ]]; then
  echo "[DRY-RUN] Would update the following manifests to v${NEW_VERSION}:"
  echo "  - package.json"
  echo "  - apps/desktop/package.json"
  echo "  - apps/desktop/src-tauri/tauri.conf.json"
  echo "  - apps/desktop/src-tauri/Cargo.toml"
  echo "  - apps/website/package.json"
  echo "  - apps/mobile/app.json"
  exit 0
fi

# 1. Update root package.json
node -e "
  const fs = require('fs');
  const path = '$ROOT_PKG';
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  pkg.version = '$NEW_VERSION';
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
"

# 2. Update apps/desktop/package.json
node -e "
  const fs = require('fs');
  const path = '${REPO_ROOT}/apps/desktop/package.json';
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  pkg.version = '$NEW_VERSION';
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
"

# 3. Update apps/desktop/src-tauri/tauri.conf.json
node -e "
  const fs = require('fs');
  const path = '${REPO_ROOT}/apps/desktop/src-tauri/tauri.conf.json';
  const conf = JSON.parse(fs.readFileSync(path, 'utf8'));
  conf.version = '$NEW_VERSION';
  fs.writeFileSync(path, JSON.stringify(conf, null, 2) + '\n');
"

# 4. Update apps/desktop/src-tauri/Cargo.toml
node -e "
  const fs = require('fs');
  const path = '${REPO_ROOT}/apps/desktop/src-tauri/Cargo.toml';
  let toml = fs.readFileSync(path, 'utf8');
  // Match version = \"...\" specifically in the [package] block
  toml = toml.replace(/(\[package\][^]*?version\s*=\s*\")[^\"]+(\")/, \`\$1$NEW_VERSION\$2\`);
  fs.writeFileSync(path, toml);
"

# 5. Update apps/website/package.json
node -e "
  const fs = require('fs');
  const path = '${REPO_ROOT}/apps/website/package.json';
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  pkg.version = '$NEW_VERSION';
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
"

# 6. Update apps/mobile/app.json
node -e "
  const fs = require('fs');
  const path = '${REPO_ROOT}/apps/mobile/app.json';
  const app = JSON.parse(fs.readFileSync(path, 'utf8'));
  if (app.expo) {
    app.expo.version = '$NEW_VERSION';
  }
  fs.writeFileSync(path, JSON.stringify(app, null, 2) + '\n');
"

# Verify all manifests are synchronized
bash "${SCRIPT_DIR}/check-version-sync.sh"
echo "Successfully bumped all manifests to v${NEW_VERSION}"
