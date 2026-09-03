import {
  compareSemver,
  isSemverGte,
  isValidSemver,
  resolveCompatiblePluginVersion,
  type VersionCompatibilityMap,
} from "@app/plugin-api";
import type {
  GithubRelease,
  RegistryEntry,
  ResolvedPluginRelease,
} from "./pluginRegistry";

export function resolvePluginRelease(
  entry: RegistryEntry,
  releases: GithubRelease[],
  versions: VersionCompatibilityMap,
  currentAppVersion: string,
): ResolvedPluginRelease | null {
  const compatibleVersion = resolveCompatiblePluginVersion(
    versions,
    currentAppVersion,
  );
  if (!compatibleVersion) return null;
  const release = releases.find(
    (candidate) => candidate.version === compatibleVersion,
  );
  if (
    !release ||
    !isValidSemver(release.version) ||
    !isSemverGte(currentAppVersion, versions[release.version])
  )
    return null;
  return {
    entry,
    version: release.version,
    minAppVersion: versions[release.version],
    downloadUrl: release.assetUrl,
  };
}

export function isUpdateAvailable(
  installed: string,
  release: ResolvedPluginRelease,
): boolean {
  return (
    isValidSemver(installed) && compareSemver(release.version, installed) > 0
  );
}
