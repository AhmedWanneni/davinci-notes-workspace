import type { FilterFunction } from "./filterTypes.js";
import { asText } from "./coerceValue.js";

/**
 * Turn untrusted text into a single path segment that cannot escape its folder
 * (ADR-0176, plan §5). This is a *safety* function, not a prettifier: it is
 * applied to every note name and every folder segment before a path is built.
 *
 * The extension and the desktop both call this, so behaviour must stay
 * identical on both sides — a clip that survives the extension must survive the
 * desktop, and vice versa.
 */
export type SafeNameOs = "windows" | "mac" | "linux";

export interface SafeNameOptions {
  /** Omit for the conservative union of all three platforms. */
  os?: SafeNameOs;
  maxLength?: number;
  fallback?: string;
}

const DEFAULT_MAX_LENGTH = 200;
const DEFAULT_FALLBACK = "Untitled";

/** Windows device names are invalid even with an extension. */
const RESERVED_NAMES = new Set([
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9",
]);

function stripIllegalCharacters(name: string, os?: SafeNameOs): string {
  // Backslash is a Windows separator and confusing elsewhere: always removed.
  if (os === "linux") return name.replace(/[/\\]/g, "");
  if (os === "mac") return name.replace(/[/:\\]/g, "");
  // Windows and the conservative default.
  return name.replace(/[/\\<>:"|?*]/g, "");
}

function stripControlCharacters(value: string): string {
  let result = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 0x1f || code === 0x7f) continue;
    result += char;
  }
  return result;
}

export function safeName(input: string, options: SafeNameOptions = {}): string {
  const os = options.os;
  const windowsRules = os === undefined || os === "windows";

  let name = stripControlCharacters(asText(input).normalize("NFC"));
  name = stripIllegalCharacters(name, os);

  // Collapse any run of dots so `..` can never form, then drop edge dots/spaces.
  name = name.replace(/\.\.+/g, ".");
  name = name.replace(/\s+/g, " ").trim();
  name = name.replace(/^[.\s]+/, "").replace(/[.\s]+$/, "");

  if (windowsRules && name.length > 0) {
    const stem = name.split(".")[0].toUpperCase();
    if (RESERVED_NAMES.has(stem)) name = `_${name}`;
  }

  const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;
  if (name.length > maxLength) {
    name = name.slice(0, maxLength).replace(/[.\s]+$/, "");
  }

  if (name.length === 0) return options.fallback ?? DEFAULT_FALLBACK;
  return name;
}

export const safeNameFilter: FilterFunction = (value, args) => {
  const os = args[0];
  const option =
    os === "windows" || os === "mac" || os === "linux" ? os : undefined;
  return safeName(asText(value), { os: option });
};

/** A rendered vault-relative path is only ever `/`-joined safe segments. */
export function isSafeRelativePath(path: string): boolean {
  if (path.length === 0) return false;
  if (path.startsWith("/") || path.includes("\\")) return false;
  return path
    .split("/")
    .every(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    );
}
