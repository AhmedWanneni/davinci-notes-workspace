/**
 * Pure path normalization and classification utilities for mobile vault storage.
 */

export function normalizeVaultPath(path: string): string {
  if (!path) return "";
  const nfc = path.normalize("NFC");
  const normalized = nfc.replaceAll("\\", "/").trim();
  const segments = normalized
    .split("/")
    .filter((s) => s.length > 0 && s !== ".");
  const resolved: string[] = [];

  for (const seg of segments) {
    if (seg === "..") {
      resolved.pop();
    } else {
      resolved.push(seg);
    }
  }

  return resolved.join("/");
}

export function isHiddenPath(relativePath: string): boolean {
  if (!relativePath) return false;
  const segments = relativePath.split("/");
  return segments.some((segment) => segment.startsWith("."));
}

export function isMarkdownPath(relativePath: string): boolean {
  if (!relativePath) return false;
  const lower = relativePath.toLowerCase();
  return lower.endsWith(".md") || lower.endsWith(".markdown");
}

export function joinVaultPaths(base: string, ...segments: string[]): string {
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const parts = segments
    .map((s) => s.replaceAll("\\", "/").replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);

  if (parts.length === 0) return cleanBase;
  return `${cleanBase}/${parts.join("/")}`;
}

export function assertSafeVaultPath(relativePath: string): void {
  if (!relativePath) {
    throw new Error("Vault path cannot be empty.");
  }
  if (relativePath.includes("\0")) {
    throw new Error("Vault path contains null bytes.");
  }
  const normalized = relativePath.replaceAll("\\", "/");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.includes("..") || normalized.startsWith("/")) {
    throw new Error(`Path traversal is forbidden: ${relativePath}`);
  }
}

export function getParentFolder(relativePath: string): string {
  const normalized = normalizeVaultPath(relativePath);
  const lastSlash = normalized.lastIndexOf("/");
  return lastSlash > 0 ? normalized.slice(0, lastSlash) : "";
}

export function getFilenameStem(relativePath: string): string {
  const normalized = normalizeVaultPath(relativePath);
  const filename = normalized.split("/").pop() ?? "";
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(0, dot) : filename;
}

/**
 * Normalizes any POSIX path or file URI into an RFC 2396 compliant file:// URI.
 * - Leaves content:// URIs untouched (Android SAF).
 * - Decodes existing components to prevent double encoding (%20 -> %2520).
 * - Encodes path segments so spaces (%20) avoid java.net.URI IllegalArgumentException.
 */
export function normalizeToValidFileUri(pathOrUri: string): string {
  if (!pathOrUri) return "";
  const trimmed = pathOrUri.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("content://")) {
    return trimmed;
  }

  const rawPath = trimmed.replace(/^file:\/*/, "/");
  let decodedPath = rawPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch {
    decodedPath = rawPath;
  }

  const segments = decodedPath
    .replace(/\\/g, "/")
    .split("/")
    .filter((s) => s.length > 0 && s !== ".");

  const resolved: string[] = [];
  for (const seg of segments) {
    if (seg === "..") {
      resolved.pop();
    } else {
      resolved.push(seg);
    }
  }

  const encodedSegments = resolved.map((seg) => encodeURIComponent(seg));
  return `file:///${encodedSegments.join("/")}`;
}

/**
 * Converts a file:// URI or POSIX path to a plain decoded POSIX filesystem path.
 */
export function toPosixPath(fileUriOrPath: string): string {
  if (!fileUriOrPath) return "";
  const trimmed = fileUriOrPath.trim();
  if (trimmed.startsWith("content://")) return trimmed;
  const stripped = trimmed.replace(/^file:\/*/, "/");
  try {
    return decodeURIComponent(stripped);
  } catch {
    return stripped;
  }
}
