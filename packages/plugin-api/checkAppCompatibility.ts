import { isSemverGte, isValidSemver } from "./semverUtils.js";

export interface AppCompatibilityResult {
  /** True if the running DaVinci Notes version satisfies the plugin's minAppVersion. */
  compatible: boolean;
  currentAppVersion: string;
  minAppVersion: string;
  /** Human-readable explanation when incompatible or when versions are invalid. */
  reason?: string;
}

/**
 * Evaluates whether a plugin's declared minAppVersion is compatible with the host app version.
 *
 * Architectural Decision:
 * Compatibility evaluation is decoupled from manifest schema validation.
 * Manifest validation checks that minAppVersion is syntactically valid SemVer;
 * this function performs the environmental compatibility check at runtime / install time.
 */
export function checkAppCompatibility(
  minAppVersion: string,
  currentAppVersion: string,
): AppCompatibilityResult {
  if (!isValidSemver(minAppVersion)) {
    return {
      compatible: false,
      currentAppVersion,
      minAppVersion,
      reason: `Plugin minAppVersion "${minAppVersion}" is not a valid SemVer string.`,
    };
  }

  if (!isValidSemver(currentAppVersion)) {
    return {
      compatible: false,
      currentAppVersion,
      minAppVersion,
      reason: `Current app version "${currentAppVersion}" is not a valid SemVer string.`,
    };
  }

  const compatible = isSemverGte(currentAppVersion, minAppVersion);

  if (!compatible) {
    return {
      compatible: false,
      currentAppVersion,
      minAppVersion,
      reason: `Plugin requires DaVinci Notes version ${minAppVersion} or higher (current version is ${currentAppVersion}).`,
    };
  }

  return {
    compatible: true,
    currentAppVersion,
    minAppVersion,
  };
}
