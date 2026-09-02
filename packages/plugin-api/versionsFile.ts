import { ValidationResult, ValidationError } from "./manifestTypes.js";
import { compareSemver, isSemverGte, isValidSemver } from "./semverUtils.js";

/**
 * Standard mapping of plugin release versions to the minimum DaVinci Notes version required.
 * Equivalent to Obsidian's versions.json.
 *
 * File Convention:
 * - Filename: `versions.json`
 * - Location: Repository root of the plugin project (published alongside release assets or indexed in registry).
 */
export type VersionCompatibilityMap = Record<string, string>;

/**
 * Validates a raw object as a valid versions.json map.
 * Ensures every key (plugin version) and value (minAppVersion) is valid SemVer.
 */
export function validateVersionsFile(
  raw: unknown,
): ValidationResult<VersionCompatibilityMap> {
  const errors: ValidationError[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {
      success: false,
      errors: [
        {
          field: "versions",
          message:
            "versions.json must be a JSON object mapping plugin versions to app versions.",
        },
      ],
    };
  }

  const obj = raw as Record<string, unknown>;
  const result: VersionCompatibilityMap = {};

  for (const [pluginVer, appVer] of Object.entries(obj)) {
    if (!isValidSemver(pluginVer)) {
      errors.push({
        field: pluginVer,
        message: `Key "${pluginVer}" is not a valid SemVer plugin version string.`,
      });
    }

    if (typeof appVer !== "string" || !isValidSemver(appVer)) {
      errors.push({
        field: pluginVer,
        message: `Value for version "${pluginVer}" ("${String(appVer)}") is not a valid SemVer minAppVersion string.`,
      });
    } else {
      result[pluginVer] = appVer;
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: result };
}

/**
 * Resolves the highest compatible plugin version for a given DaVinci Notes app version.
 * Returns null if no compatible plugin version is found.
 */
export function resolveCompatiblePluginVersion(
  versionsMap: VersionCompatibilityMap,
  currentAppVersion: string,
): string | null {
  if (!isValidSemver(currentAppVersion)) return null;

  const candidatePluginVersions = Object.keys(versionsMap).filter(
    (pluginVer) => {
      const minAppVer = versionsMap[pluginVer];
      return (
        isValidSemver(pluginVer) &&
        isValidSemver(minAppVer) &&
        isSemverGte(currentAppVersion, minAppVer)
      );
    },
  );

  if (candidatePluginVersions.length === 0) return null;

  // Sort descending by SemVer to get the newest compatible release
  candidatePluginVersions.sort((a, b) => compareSemver(b, a));

  return candidatePluginVersions[0];
}
