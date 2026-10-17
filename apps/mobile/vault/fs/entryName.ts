/**
 * The ONE place where user-supplied vault / file names are made safe for
 * on-disk use (ADR-0196). Encoding into a URI is NOT done here — that is the
 * job of the expo-file-system `File` / `Directory` constructors, which
 * percent-encode each joined segment. This function only guarantees that the
 * resulting *name* is legal on Android ext4/FUSE, SAF providers, iOS APFS and
 * FAT-formatted SD cards.
 */

/** ext4 / APFS limit is 255 bytes per name; keep headroom for temp suffixes. */
export const MAX_ENTRY_NAME_BYTES = 200;

const RESERVED_CHARS = /[/\\:*?"<>|]/g;
// C0 + DEL + C1 control characters, plus bidi/zero-width format controls that
// would make two visually identical names differ.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS =
  /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

const encoder = new TextEncoder();

function utf8Length(value: string): number {
  return encoder.encode(value).byteLength;
}

/** Truncates on code-point boundaries so emoji / Arabic never get split. */
export function truncateToBytes(value: string, maxBytes: number): string {
  if (utf8Length(value) <= maxBytes) return value;
  let out = "";
  let used = 0;
  for (const codePoint of value) {
    const size = utf8Length(codePoint);
    if (used + size > maxBytes) break;
    out += codePoint;
    used += size;
  }
  return out;
}

export interface SanitizeEntryNameOptions {
  /** Used when the cleaned name is empty. */
  fallback?: string;
  /** Extension (with dot, e.g. ".md") kept intact when truncating. */
  extension?: string;
  maxBytes?: number;
}

/**
 * Returns a filesystem-safe single path segment. Spaces (including runs of
 * spaces), accents, Arabic and emoji are preserved; only characters that are
 * illegal or dangerous on some target filesystem are replaced.
 */
export function sanitizeEntryName(
  raw: string,
  options: SanitizeEntryNameOptions = {},
): string {
  const {
    fallback = "Untitled",
    extension = "",
    maxBytes = MAX_ENTRY_NAME_BYTES,
  } = options;
  let base = raw.normalize("NFC");
  if (extension && base.toLowerCase().endsWith(extension.toLowerCase())) {
    base = base.slice(0, -extension.length);
  }

  base = base
    .replace(CONTROL_CHARS, "")
    .replace(RESERVED_CHARS, "_")
    .trim()
    // Trailing dots/spaces are silently stripped by FAT/SAF providers and
    // would make the stored name diverge from the on-disk name.
    .replace(/[.\s]+$/u, "")
    // A leading dot hides the entry from the vault scanner.
    .replace(/^\.+/, "_");

  if (base === "." || base === ".." || base.length === 0) base = fallback;
  if (WINDOWS_RESERVED.test(base)) base = `_${base}`;

  const budget = Math.max(1, maxBytes - utf8Length(extension));
  base = truncateToBytes(base, budget).replace(/[.\s]+$/u, "") || fallback;
  return `${base}${extension}`;
}

/** Splits a vault-relative path into sanitized-free raw segments. */
export function splitRelativePath(relativePath: string): string[] {
  return relativePath
    .normalize("NFC")
    .replaceAll("\\", "/")
    .split("/")
    .filter((segment) => segment.length > 0 && segment !== ".");
}
