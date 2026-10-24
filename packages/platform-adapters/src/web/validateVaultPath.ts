export function normalizeVaultPath(rawPath: string): string {
  const normalized = rawPath.replaceAll("\\", "/").trim();
  if (!normalized) {
    throw new Error("Invalid vault path: path cannot be empty");
  }
  if (normalized.includes("\0")) {
    throw new Error("Invalid vault path: null byte is forbidden");
  }

  const segments = normalized.split("/").filter(Boolean);
  for (const segment of segments) {
    if (segment === ".." || segment === ".") {
      throw new Error(`Unsafe vault path traversal: ${rawPath}`);
    }
    if (/[:*?"<>|]/u.test(segment)) {
      throw new Error(`Invalid character in path segment: ${segment}`);
    }
  }

  return segments.join("/");
}
