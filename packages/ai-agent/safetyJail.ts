export class SafetyJailError extends Error {
  readonly code:
    | "absolute-path"
    | "traversal-detected"
    | "banned-directory"
    | "hidden-system-file"
    | "invalid-character"
    | "empty-path";

  constructor(
    code: SafetyJailError["code"],
    message: string,
  ) {
    super(message);
    this.name = "SafetyJailError";
    this.code = code;
  }
}

const BANNED_PREFIXES = [
  ".git/",
  ".git",
  ".trash/",
  ".trash",
];

const PERMITTED_DAVINCI_PREFIXES = [
  ".davinci/agent/",
];

const WINDOWS_RESERVED_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i;

/**
 * Normalise and strictly validate that a path is safe to read or write inside the vault.
 * Throws SafetyJailError if any safety violation is detected.
 */
export function validateVaultRelativePath(rawPath: string): string {
  if (!rawPath || typeof rawPath !== "string") {
    throw new SafetyJailError("empty-path", "Path must be a non-empty string");
  }

  // Normalise backslashes
  let clean = rawPath.replace(/\\/g, "/").trim();

  // Strip leading ./
  while (clean.startsWith("./")) {
    clean = clean.slice(2);
  }

  // Reject absolute paths
  if (clean.startsWith("/") || /^[a-zA-Z]:/.test(clean)) {
    throw new SafetyJailError("absolute-path", `Absolute paths are strictly forbidden: "${rawPath}"`);
  }

  // Check for path traversal components
  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) {
    throw new SafetyJailError("empty-path", "Path must not resolve to empty root");
  }

  for (const segment of segments) {
    if (segment === ".." || segment === ".") {
      throw new SafetyJailError("traversal-detected", `Path traversal segment "${segment}" detected in "${rawPath}"`);
    }
    if (segment.includes("\0")) {
      throw new SafetyJailError("invalid-character", `Null byte detected in path segment "${segment}"`);
    }
    if (WINDOWS_RESERVED_NAMES.test(segment)) {
      throw new SafetyJailError("invalid-character", `Windows reserved device name "${segment}" forbidden`);
    }
    if (segment === ".DS_Store" || segment === "Thumbs.db") {
      throw new SafetyJailError("hidden-system-file", `OS system file "${segment}" is forbidden`);
    }
  }

  const normalised = segments.join("/");

  // Check banned prefixes
  for (const banned of BANNED_PREFIXES) {
    if (normalised === banned || normalised.startsWith(`${banned}/`)) {
      throw new SafetyJailError("banned-directory", `Access to version control or trash folder "${banned}" is forbidden`);
    }
  }

  // Check .davinci/ containment
  if (normalised === ".davinci" || normalised.startsWith(".davinci/")) {
    const isPermitted = PERMITTED_DAVINCI_PREFIXES.some(
      (prefix) => normalised.startsWith(prefix),
    );
    if (!isPermitted) {
      throw new SafetyJailError("banned-directory", `Access to internal configuration file "${normalised}" is forbidden`);
    }
  }

  return normalised;
}
