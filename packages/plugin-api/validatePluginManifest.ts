import {
  PLUGIN_PERMISSIONS,
  PluginManifest,
  PluginPermission,
  ValidationError,
  ValidationResult,
} from "./manifestTypes.js";
import { isValidSemver } from "./semverUtils.js";

const KNOWN_FIELDS = new Set([
  "id",
  "name",
  "version",
  "minAppVersion",
  "description",
  "author",
  "main",
  "isDesktopOnly",
  "permissions",
  "authorUrl",
  "fundingUrl",
  "license",
  "styles",
  "keywords",
]);

const ID_REGEX = /^[a-zA-Z0-9_-]+$/;

export interface ValidateManifestOptions {
  /**
   * If true (default), rejects any unknown properties not defined in the manifest specification.
   * Rationale: Catches typos (e.g. 'permisions') and prevents silent security/config omissions.
   */
  strict?: boolean;
}

function isValidHttpUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates a raw JSON object against the DaVinci Notes Plugin Manifest specification.
 */
export function validatePluginManifest(
  raw: unknown,
  options: ValidateManifestOptions = {},
): ValidationResult<PluginManifest> {
  const strict = options.strict !== false;
  const errors: ValidationError[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {
      success: false,
      errors: [
        {
          field: "manifest",
          message: "Manifest must be a non-null JSON object.",
        },
      ],
    };
  }

  const obj = raw as Record<string, unknown>;

  // Check strictness for unknown fields
  if (strict) {
    for (const key of Object.keys(obj)) {
      if (!KNOWN_FIELDS.has(key)) {
        errors.push({
          field: key,
          message: `Unknown field "${key}". Manifest must only declare recognized properties.`,
        });
      }
    }
  }

  // Required: id
  if (typeof obj.id !== "string" || obj.id.trim() === "") {
    errors.push({
      field: "id",
      message: 'Required field "id" is missing or empty.',
    });
  } else if (!ID_REGEX.test(obj.id)) {
    errors.push({
      field: "id",
      message: `Field "id" ("${obj.id}") must only contain alphanumeric characters, hyphens, and underscores.`,
    });
  }

  // Required: name
  if (typeof obj.name !== "string" || obj.name.trim() === "") {
    errors.push({
      field: "name",
      message: 'Required field "name" is missing or empty.',
    });
  }

  // Required: version (SemVer)
  if (typeof obj.version !== "string" || obj.version.trim() === "") {
    errors.push({
      field: "version",
      message: 'Required field "version" is missing or empty.',
    });
  } else if (!isValidSemver(obj.version)) {
    errors.push({
      field: "version",
      message: `Invalid version "${obj.version}". Must be a valid SemVer 2.0.0 string (e.g. "1.0.0").`,
    });
  }

  // Required: minAppVersion (SemVer)
  if (
    typeof obj.minAppVersion !== "string" ||
    obj.minAppVersion.trim() === ""
  ) {
    errors.push({
      field: "minAppVersion",
      message: 'Required field "minAppVersion" is missing or empty.',
    });
  } else if (!isValidSemver(obj.minAppVersion)) {
    errors.push({
      field: "minAppVersion",
      message: `Invalid minAppVersion "${obj.minAppVersion}". Must be a valid SemVer 2.0.0 string (e.g. "0.1.0").`,
    });
  }

  // Required: description
  if (typeof obj.description !== "string") {
    errors.push({
      field: "description",
      message: 'Required field "description" is missing.',
    });
  }

  // Required: author
  if (typeof obj.author !== "string" || obj.author.trim() === "") {
    errors.push({
      field: "author",
      message: 'Required field "author" is missing or empty.',
    });
  }

  // Required: main
  if (typeof obj.main !== "string" || obj.main.trim() === "") {
    errors.push({
      field: "main",
      message: 'Required field "main" is missing or empty.',
    });
  } else if (obj.main.startsWith("/") || obj.main.startsWith("../")) {
    errors.push({
      field: "main",
      message: `Field "main" ("${obj.main}") must be a relative path within the plugin package.`,
    });
  }

  // Optional: isDesktopOnly
  if (
    obj.isDesktopOnly !== undefined &&
    typeof obj.isDesktopOnly !== "boolean"
  ) {
    errors.push({
      field: "isDesktopOnly",
      message: 'Field "isDesktopOnly" must be a boolean.',
    });
  }

  // Optional: permissions
  if (obj.permissions !== undefined) {
    if (!Array.isArray(obj.permissions)) {
      errors.push({
        field: "permissions",
        message: 'Field "permissions" must be an array of permission strings.',
      });
    } else {
      const seen = new Set<string>();
      const validPermissionsSet = new Set<string>(PLUGIN_PERMISSIONS);
      for (const p of obj.permissions) {
        if (typeof p !== "string" || !validPermissionsSet.has(p)) {
          errors.push({
            field: "permissions",
            message: `Invalid permission "${p}". Allowed values: ${PLUGIN_PERMISSIONS.join(", ")}.`,
          });
        } else if (seen.has(p)) {
          errors.push({
            field: "permissions",
            message: `Duplicate permission "${p}".`,
          });
        } else {
          seen.add(p);
        }
      }
    }
  }

  // Optional URLs
  if (obj.authorUrl !== undefined) {
    if (typeof obj.authorUrl !== "string" || !isValidHttpUrl(obj.authorUrl)) {
      errors.push({
        field: "authorUrl",
        message: 'Field "authorUrl" must be a valid HTTP/HTTPS URL.',
      });
    }
  }

  if (obj.fundingUrl !== undefined) {
    if (typeof obj.fundingUrl !== "string" || !isValidHttpUrl(obj.fundingUrl)) {
      errors.push({
        field: "fundingUrl",
        message: 'Field "fundingUrl" must be a valid HTTP/HTTPS URL.',
      });
    }
  }

  // Optional strings
  if (obj.license !== undefined && typeof obj.license !== "string") {
    errors.push({
      field: "license",
      message: 'Field "license" must be a string.',
    });
  }

  if (obj.styles !== undefined && typeof obj.styles !== "string") {
    errors.push({
      field: "styles",
      message: 'Field "styles" must be a string path.',
    });
  }

  // Optional keywords
  if (obj.keywords !== undefined) {
    if (
      !Array.isArray(obj.keywords) ||
      obj.keywords.some((k) => typeof k !== "string")
    ) {
      errors.push({
        field: "keywords",
        message: 'Field "keywords" must be an array of strings.',
      });
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const manifest: PluginManifest = {
    id: (obj.id as string).trim(),
    name: (obj.name as string).trim(),
    version: (obj.version as string).trim(),
    minAppVersion: (obj.minAppVersion as string).trim(),
    description: (obj.description as string).trim(),
    author: (obj.author as string).trim(),
    main: (obj.main as string).trim(),
    isDesktopOnly:
      obj.isDesktopOnly !== undefined ? (obj.isDesktopOnly as boolean) : false,
    permissions:
      obj.permissions !== undefined
        ? (obj.permissions as PluginPermission[])
        : [],
    ...(obj.authorUrl ? { authorUrl: (obj.authorUrl as string).trim() } : {}),
    ...(obj.fundingUrl
      ? { fundingUrl: (obj.fundingUrl as string).trim() }
      : {}),
    ...(obj.license ? { license: (obj.license as string).trim() } : {}),
    ...(obj.styles ? { styles: (obj.styles as string).trim() } : {}),
    ...(obj.keywords ? { keywords: obj.keywords as string[] } : {}),
  };

  return { success: true, data: manifest };
}
