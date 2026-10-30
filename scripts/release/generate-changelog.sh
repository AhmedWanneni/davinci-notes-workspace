#!/usr/bin/env bash
set -euo pipefail

SINCE_TAG=""
OUT_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --since)
      SINCE_TAG="$2"
      shift 2
      ;;
    --out)
      OUT_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: $0 [--since <tag>] [--out <file>]" >&2
      exit 1
      ;;
  esac
done

# If no since tag passed, find most recent tag
if [[ -z "$SINCE_TAG" ]]; then
  if git describe --tags --abbrev=0 >/dev/null 2>&1; then
    SINCE_TAG="$(git describe --tags --abbrev=0)"
  else
    SINCE_TAG=""
  fi
fi

if [[ -n "$SINCE_TAG" ]]; then
  COMMIT_RANGE="${SINCE_TAG}..HEAD"
  HEADER_NOTE="Changes since ${SINCE_TAG}:"
else
  COMMIT_RANGE="HEAD"
  HEADER_NOTE="Initial release changes:"
fi

# Generate grouped notes via Node parser
GENERATED_NOTES="$(node -e "
  const { execSync } = require('child_process');
  let rawLog = '';
  try {
    rawLog = execSync(\`git log ${COMMIT_RANGE} --pretty=format:\"%s||%h\"\`, { encoding: 'utf8' }).trim();
  } catch (err) {
    rawLog = '';
  }

  if (!rawLog) {
    console.log('_No commits found in range._');
    process.exit(0);
  }

  const lines = rawLog.split('\n');
  const groups = {
    breaking: [],
    feat: [],
    fix: [],
    perf: [],
    refactor: [],
    other: []
  };

  for (const line of lines) {
    const parts = line.split('||');
    if (parts.length < 2) continue;
    const [subject, hash] = parts;
    const entry = \`- \${subject} (\${hash})\`;

    if (/BREAKING CHANGE|!:/.test(subject)) {
      groups.breaking.push(entry);
    } else if (/^feat(\(.*\))?:/.test(subject)) {
      groups.feat.push(entry);
    } else if (/^fix(\(.*\))?:/.test(subject)) {
      groups.fix.push(entry);
    } else if (/^perf(\(.*\))?:/.test(subject)) {
      groups.perf.push(entry);
    } else if (/^refactor(\(.*\))?:/.test(subject)) {
      groups.refactor.push(entry);
    }
  }

  const output = [];
  output.push('### Highlights & Changes');
  output.push('');

  if (groups.breaking.length) {
    output.push('#### ⚠️ Breaking Changes');
    output.push(...groups.breaking);
    output.push('');
  }
  if (groups.feat.length) {
    output.push('#### ✨ Features');
    output.push(...groups.feat);
    output.push('');
  }
  if (groups.fix.length) {
    output.push('#### 🐛 Bug Fixes');
    output.push(...groups.fix);
    output.push('');
  }
  if (groups.perf.length) {
    output.push('#### ⚡ Performance Improvements');
    output.push(...groups.perf);
    output.push('');
  }
  if (groups.refactor.length) {
    output.push('#### ♻️ Refactoring & Polish');
    output.push(...groups.refactor);
    output.push('');
  }

  if (output.length === 2) {
    output.push('_Maintenance and stabilization updates._');
  }

  console.log(output.join('\n'));
")"

if [[ -n "$OUT_FILE" ]]; then
  echo "$GENERATED_NOTES" > "$OUT_FILE"
  echo "Changelog written to $OUT_FILE"
else
  echo "$GENERATED_NOTES"
fi
