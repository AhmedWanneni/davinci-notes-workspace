import type {
  ThemeManifest,
  ThemeValidationError,
  ThemeValidationResult,
} from "./themeManifestTypes.js";

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/u;
const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u;
const FIELDS = new Set([
  "id",
  "name",
  "version",
  "minAppVersion",
  "author",
  "description",
  "styles",
  "authorUrl",
  "license",
  "keywords",
]);

function requiredString(
  obj: Record<string, unknown>,
  field: string,
  errors: ThemeValidationError[],
): void {
  if (typeof obj[field] !== "string" || obj[field].trim() === "")
    errors.push({
      field,
      message: `Required field "${field}" is missing or empty.`,
    });
}

function maxLength(
  obj: Record<string, unknown>,
  field: string,
  limit: number,
  errors: ThemeValidationError[],
): void {
  if (typeof obj[field] === "string" && obj[field].length > limit)
    errors.push({
      field,
      message: `${field} must be at most ${limit} characters.`,
    });
}

export function validateThemeManifest(raw: unknown): ThemeValidationResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return {
      success: false,
      errors: [
        {
          field: "manifest",
          message: "Manifest must be a non-null JSON object.",
        },
      ],
    };
  const obj = raw as Record<string, unknown>;
  const errors: ThemeValidationError[] = [];
  for (const field of Object.keys(obj))
    if (!FIELDS.has(field))
      errors.push({ field, message: `Unknown field "${field}".` });
  for (const field of [
    "id",
    "name",
    "version",
    "minAppVersion",
    "author",
    "description",
    "styles",
  ])
    requiredString(obj, field, errors);
  maxLength(obj, "id", 100, errors);
  maxLength(obj, "name", 100, errors);
  maxLength(obj, "author", 100, errors);
  maxLength(obj, "description", 500, errors);
  if (typeof obj.id === "string" && !ID_PATTERN.test(obj.id))
    errors.push({
      field: "id",
      message:
        "ID must contain only alphanumeric characters, hyphens, and underscores.",
    });
  for (const field of ["version", "minAppVersion"])
    if (typeof obj[field] === "string" && !SEMVER_PATTERN.test(obj[field]))
      errors.push({
        field,
        message: `${field} must be a valid SemVer 2.0.0 string.`,
      });
  if (
    typeof obj.styles === "string" &&
    (!obj.styles.endsWith(".css") ||
      obj.styles.startsWith("/") ||
      obj.styles.split("/").includes(".."))
  )
    errors.push({
      field: "styles",
      message: "Styles must be a relative CSS path inside the theme package.",
    });
  for (const field of ["authorUrl"])
    if (
      obj[field] !== undefined &&
      (typeof obj[field] !== "string" || !/^https?:\/\//u.test(obj[field]))
    )
      errors.push({ field, message: `${field} must be an HTTP or HTTPS URL.` });
  if (
    obj.keywords !== undefined &&
    (!Array.isArray(obj.keywords) ||
      obj.keywords.some((keyword) => typeof keyword !== "string"))
  )
    errors.push({
      field: "keywords",
      message: "Keywords must be an array of strings.",
    });
  if (
    Array.isArray(obj.keywords) &&
    new Set(obj.keywords).size !== obj.keywords.length
  )
    errors.push({
      field: "keywords",
      message: "Keywords must not contain duplicates.",
    });
  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: obj as unknown as ThemeManifest };
}
