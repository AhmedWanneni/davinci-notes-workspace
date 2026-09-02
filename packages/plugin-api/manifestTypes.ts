/**
 * Core capability-scoped permissions for DaVinci Notes plugins.
 * Established in ADR-0131 (Option 2: Capability-Scoped Permissions per Plugin).
 */
export const PLUGIN_PERMISSIONS = [
  "vault:read",
  "vault:write",
  "network",
  "shell",
  "editor:read",
  "editor:write",
  "commands",
  "ui:view",
] as const;

export type PluginPermission = (typeof PLUGIN_PERMISSIONS)[number];

/**
 * DaVinci Notes Plugin Manifest format.
 * Defines the static metadata, entry file, required capabilities, and app compatibility.
 */
export interface PluginManifest {
  /** Unique plugin identifier (alphanumeric, hyphens, underscores). */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** Plugin release version (SemVer 2.0.0). */
  version: string;
  /** Minimum required DaVinci Notes application version (SemVer 2.0.0). */
  minAppVersion: string;
  /** Short summary of what the plugin does. */
  description: string;
  /** Author name or organization. */
  author: string;
  /** Relative path to entry JavaScript bundle within the plugin directory (e.g. "main.js"). */
  main: string;
  /**
   * Whether the plugin requires desktop-specific capabilities.
   * Default: false (cross-platform desktop + mobile).
   */
  isDesktopOnly?: boolean;
  /**
   * Requested capability-scoped permissions approved by the user at install time.
   * Default: [] (least privilege).
   */
  permissions?: PluginPermission[];
  /** Optional author website, repository, or contact URL. */
  authorUrl?: string;
  /** Optional sponsorship or donation link (e.g. GitHub Sponsors, BuyMeACoffee). */
  fundingUrl?: string;
  /** Optional SPDX license identifier (e.g. "MIT", "Apache-2.0"). */
  license?: string;
  /** Optional relative path to CSS stylesheet within the plugin directory. Default: "styles.css". */
  styles?: string;
  /** Optional tags for community registry discovery and indexing. */
  keywords?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export type ValidationResult<T> =
  { success: true; data: T } | { success: false; errors: ValidationError[] };
