#!/usr/bin/env bash
set -euo pipefail

ARTIFACTS_DIR=""
OUT_CHECKSUMS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir)
      ARTIFACTS_DIR="$2"
      shift 2
      ;;
    --out-sums)
      OUT_CHECKSUMS="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: $0 --dir <artifacts-directory> [--out-sums <file>]" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$ARTIFACTS_DIR" ]]; then
  echo "Error: --dir <artifacts-directory> is required." >&2
  exit 1
fi

if [[ ! -d "$ARTIFACTS_DIR" ]]; then
  echo "Error: Directory '$ARTIFACTS_DIR' does not exist." >&2
  exit 1
fi

echo "=== Verifying Release Artifacts in $ARTIFACTS_DIR ==="

compute_sha256() {
  local target="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$target" | awk '{print $1}'
  else
    shasum -a 256 "$target" | awk '{print $1}'
  fi
}

CHECKSUMS=()
ERRORS=0
COUNT=0

# Iterate through relevant package files
while IFS= read -r -d '' file; do
  COUNT=$((COUNT + 1))
  FNAME="$(basename "$file")"
  
  # Get file size in bytes
  if stat -f%z "$file" >/dev/null 2>&1; then
    FSIZE="$(stat -f%z "$file")"
  else
    FSIZE="$(stat -c%s "$file")"
  fi
  
  FSIZE_MB="$((FSIZE / 1024 / 1024))"
  
  # Validate minimum size for installers (> 5MB)
  if [[ "$FNAME" =~ \.(dmg|exe|AppImage|deb)$ ]]; then
    if [[ $FSIZE -lt 5242880 ]]; then
      echo "WARNING: File $FNAME appears too small ($FSIZE_MB MB)!" >&2
      ERRORS=$((ERRORS + 1))
    fi
  fi
  
  HASH="$(compute_sha256 "$file")"
  echo "  $HASH  $FNAME  (${FSIZE_MB} MB)"
  CHECKSUMS+=("$HASH  $FNAME")
done < <(find "$ARTIFACTS_DIR" -type f \( -name "*.dmg" -o -name "*.exe" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.tar.gz" -o -name "*.zip" -o -name "*.sig" \) -print0)

if [[ $COUNT -eq 0 ]]; then
  echo "No release artifact files found in $ARTIFACTS_DIR!" >&2
  exit 1
fi

if [[ -n "$OUT_CHECKSUMS" ]]; then
  printf "%s\n" "${CHECKSUMS[@]}" > "$OUT_CHECKSUMS"
  echo "Wrote checksums to $OUT_CHECKSUMS"
fi

if [[ $ERRORS -gt 0 ]]; then
  echo "Artifact verification finished with $ERRORS warning(s)."
else
  echo "[OK] Verified $COUNT artifact(s) successfully."
fi
