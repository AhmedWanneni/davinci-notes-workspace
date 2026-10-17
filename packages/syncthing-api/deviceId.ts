/**
 * Normalizes a Device ID by stripping spaces, hyphens, and uppercase converting.
 */
export function normalizeDeviceId(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}

/**
 * Validates whether a device ID conforms to the standard 56-character
 * alphanumeric format (8 groups of 7 characters).
 */
export function isValidDeviceIdFormat(raw: string): boolean {
  const clean = normalizeDeviceId(raw);
  return clean.length === 56 && /^[A-Z0-9]{56}$/.test(clean);
}

/**
 * Formats a raw device ID into hyphen-separated 7-character groups
 * (e.g. AAAAAAA-BBBBBBB-CCCCCCC-DDDDDDD-EEEEEEE-FFFFFFF-GGGGGGG-HHHHHHH).
 */
export function formatDeviceIdGroups(raw: string): string {
  const clean = normalizeDeviceId(raw);
  if (clean.length === 0) return raw.trim();
  const groups: string[] = [];
  for (let i = 0; i < clean.length && i < 56; i += 7) {
    groups.push(clean.slice(i, i + 7));
  }
  return groups.join("-");
}
