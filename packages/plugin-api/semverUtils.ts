/**
 * SemVer 2.0.0 official regular expression without capture groups overhead
 * https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
 */
export const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export function isValidSemver(version: string): boolean {
  if (typeof version !== "string") return false;
  return SEMVER_REGEX.test(version.trim());
}

export function parseSemver(version: string): ParsedSemver | null {
  if (!isValidSemver(version)) return null;
  const match = version.trim().match(SEMVER_REGEX);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || undefined,
  };
}

/**
 * Compares two SemVer strings (v1 vs v2).
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareSemver(v1: string, v2: string): number {
  const p1 = parseSemver(v1);
  const p2 = parseSemver(v2);

  if (!p1 || !p2) {
    throw new Error(`Cannot compare invalid semver strings: "${v1}", "${v2}"`);
  }

  if (p1.major !== p2.major) return p1.major > p2.major ? 1 : -1;
  if (p1.minor !== p2.minor) return p1.minor > p2.minor ? 1 : -1;
  if (p1.patch !== p2.patch) return p1.patch > p2.patch ? 1 : -1;

  // SemVer spec 2.0.0 item 9: A normal version has greater precedence than a pre-release version
  if (!p1.prerelease && p2.prerelease) return 1;
  if (p1.prerelease && !p2.prerelease) return -1;
  if (!p1.prerelease && !p2.prerelease) return 0;

  // Both have pre-releases: compare dot-separated identifiers
  const parts1 = (p1.prerelease ?? "").split(".");
  const parts2 = (p2.prerelease ?? "").split(".");
  const minLen = Math.min(parts1.length, parts2.length);

  for (let i = 0; i < minLen; i++) {
    const part1 = parts1[i];
    const part2 = parts2[i];

    const isNum1 = /^\d+$/.test(part1);
    const isNum2 = /^\d+$/.test(part2);

    if (isNum1 && isNum2) {
      const n1 = parseInt(part1, 10);
      const n2 = parseInt(part2, 10);
      if (n1 !== n2) return n1 > n2 ? 1 : -1;
    } else if (isNum1 && !isNum2) {
      return -1; // Numeric identifiers have lower precedence than non-numeric
    } else if (!isNum1 && isNum2) {
      return 1;
    } else {
      if (part1 !== part2) return part1 > part2 ? 1 : -1;
    }
  }

  if (parts1.length !== parts2.length) {
    return parts1.length > parts2.length ? 1 : -1;
  }

  return 0;
}

/**
 * Returns true if version is greater than or equal to minimum.
 */
export function isSemverGte(version: string, minimum: string): boolean {
  return compareSemver(version, minimum) >= 0;
}
