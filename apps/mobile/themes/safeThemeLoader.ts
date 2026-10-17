import type { MobileVaultStorageAdapter } from "../vault";

export const MAX_THEME_CSS_BYTES = 500 * 1024; // 500 KB
export const MAX_SELECTORS_PER_RULE = 50;

export interface ThemeSanitizationResult {
  isValid: boolean;
  sanitizedCss: string;
  violations: string[];
}

const REMOTE_URL_PATTERN =
  /url\(\s*(['"]?)(?:https?:|\/\/|ftp:|data:)[^'")]+?\1\s*\)/gi;
const IMPORT_PATTERN = /@import\s+[^;]+;/gi;
const SCRIPT_PATTERN =
  /(?:javascript\s*:|expression\s*\(|-moz-binding|<script[\s>])/gi;

/**
 * Sanitizes and validates CSS theme text against safe loader rules:
 * - No network: remote url() stripped
 * - No scripts: @import, javascript:, expression() stripped
 * - Pathological rules: oversized payloads and excessive selector chains rejected
 */
export function sanitizeThemeCss(rawCss: string): ThemeSanitizationResult {
  const violations: string[] = [];

  if (rawCss.length > MAX_THEME_CSS_BYTES) {
    violations.push(
      `Theme CSS exceeds maximum allowed size of ${MAX_THEME_CSS_BYTES} bytes`,
    );
    return { isValid: false, sanitizedCss: "", violations };
  }

  let cleaned = rawCss;

  // 1. Check & strip @import
  if (IMPORT_PATTERN.test(cleaned)) {
    violations.push("Remote @import directives are forbidden and were removed");
    cleaned = cleaned.replace(IMPORT_PATTERN, "/* [blocked-import] */");
  }

  // 2. Check & strip remote url()
  if (REMOTE_URL_PATTERN.test(cleaned)) {
    violations.push(
      "Remote network url() references are forbidden and were removed",
    );
    cleaned = cleaned.replace(REMOTE_URL_PATTERN, "none");
  }

  // 3. Check & strip script/expression injection
  if (SCRIPT_PATTERN.test(cleaned)) {
    violations.push(
      "Executable script or expression() references are forbidden and were removed",
    );
    cleaned = cleaned.replace(SCRIPT_PATTERN, "/* [blocked-script] */");
  }

  // 4. Check for pathological selector counts
  const rules = cleaned.split("}");
  for (const rule of rules) {
    const parts = rule.split("{");
    if (parts.length === 2) {
      const selectors = parts[0].split(",");
      if (selectors.length > MAX_SELECTORS_PER_RULE) {
        violations.push(
          `Rule with ${selectors.length} selectors exceeds maximum of ${MAX_SELECTORS_PER_RULE}`,
        );
        return { isValid: false, sanitizedCss: "", violations };
      }
    }
  }

  return {
    isValid: true,
    sanitizedCss: cleaned,
    violations,
  };
}

/**
 * Loads a theme from <vault>/.davinci/themes/<themeId>/theme.css,
 * applying safe loader sanitization before returning.
 */
export async function loadAndSanitizeVaultTheme(
  adapter: MobileVaultStorageAdapter,
  themeId: string,
): Promise<{ css: string | null; error?: string }> {
  // Sanitize theme ID against path traversal
  if (!/^[a-zA-Z0-9_-]+$/u.test(themeId)) {
    return { css: null, error: `Invalid theme ID: ${themeId}` };
  }

  const themePath = `.davinci/themes/${themeId}/theme.css`;
  try {
    const exists = await adapter.exists(themePath);
    if (!exists) {
      return { css: null };
    }

    const file = await adapter.readNote(themePath);
    const result = sanitizeThemeCss(file.content);
    if (!result.isValid) {
      return { css: null, error: result.violations.join(", ") };
    }

    return { css: result.sanitizedCss };
  } catch (err) {
    return { css: null, error: String(err) };
  }
}
