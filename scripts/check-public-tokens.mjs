import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_EXTENSIONS = /\.(?:scss|css|ts|tsx)$/u;
const EXCLUDED_FILES = /\.(?:test|stories)\./u;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?)\([^)]*\)/giu;
const HEX_COLOR = /#[\da-f]{3,8}\b/giu;
const NAMED_COLOR = /\b(?:color|background(?:-color)?|border(?:-color)?|fill|stroke)\s*:\s*["']?(?:black|white|red|green|blue|yellow|orange|purple|gray|grey)\b/giu;
const FALLBACK = /var\(\s*(--[a-z0-9-]+)\s*,[^)]*\)/giu;
const TOKEN_REFERENCE = /var\(\s*(--[a-z0-9-]+)|setProperty\(\s*["'](--[a-z0-9-]+)/giu;
const TOKEN_DECLARATION = /(?:^|[;{\s])(--[a-z0-9-]+)\s*:/gmu;

export const ALLOWLIST = [
  {
    file: "packages/editor/editorTheme.ts",
    pattern: "--editor-font-size",
    detector: "non-public-token",
    justification: "Vault-scoped editor setting applied at runtime; it is not a theme contract token.",
  },
  ...[
    "--editor-obsidian-heading-h1-size",
    "--editor-obsidian-heading-h1-weight",
    "--editor-obsidian-heading-h1-line-height",
    "--editor-obsidian-heading-h2-size",
    "--editor-obsidian-heading-h2-weight",
    "--editor-obsidian-heading-h2-line-height",
    "--editor-obsidian-heading-h3-size",
    "--editor-obsidian-heading-h3-weight",
    "--editor-obsidian-heading-h3-line-height",
    "--editor-obsidian-heading-h4-size",
    "--editor-obsidian-heading-h4-weight",
    "--editor-obsidian-heading-h4-line-height",
    "--editor-obsidian-heading-h5-size",
    "--editor-obsidian-heading-h5-weight",
    "--editor-obsidian-heading-h5-line-height",
    "--editor-obsidian-heading-h6-size",
    "--editor-obsidian-heading-h6-weight",
    "--editor-obsidian-heading-h6-line-height",
  ].map((pattern) => ({
    file: "packages/editor/editorHighlightStyle.ts",
    pattern,
    detector: "non-public-token",
    justification: "Phase 2 editor Obsidian-parity heading token consumed in Phase 3.",
  })),
  ...[
    "--editor-obsidian-body-font-size",
    "--editor-obsidian-body-line-height",
    "--editor-obsidian-content-line-padding-inline",
    "--editor-content-padding-bottom",
  ].map((pattern) => ({
    file: "packages/editor/editorTheme.ts",
    pattern,
    detector: "non-public-token",
    justification: "Phase 2 editor Obsidian-parity body/content token consumed in Phase 3.",
  })),
  {
    file: "apps/desktop/src/components/SettingsDialog/SettingsDialog.module.scss",
    pattern: "#ff5f56",
    justification: "Native-style window-control affordance, intentionally not theme content.",
  },
  {
    file: "apps/desktop/src/components/SettingsDialog/SettingsDialog.module.scss",
    pattern: "#ffbd2e",
    justification: "Native-style window-control affordance, intentionally not theme content.",
  },
  {
    file: "apps/desktop/src/components/SettingsDialog/SettingsDialog.module.scss",
    pattern: "#27c93f",
    justification: "Native-style window-control affordance, intentionally not theme content.",
  },
  {
    file: "packages/design-system/components/Dialog/Dialog.module.scss",
    pattern: "rgb(0 0 0 / 35%)",
    justification: "Compatibility fallback for the token-derived shadow layer on older Tauri webviews.",
  },
  {
    file: "packages/design-system/components/Dialog/Dialog.module.scss",
    pattern: "rgb(0 0 0 / 20%)",
    justification: "Compatibility fallback for the token-derived shadow layer on older Tauri webviews.",
  },
  {
    file: "packages/design-system/components/DropdownMenu/DropdownMenu.module.scss",
    pattern: "rgb(0 0 0 / 10%)",
    justification: "Compatibility fallback for the token-derived shadow layer on older Tauri webviews.",
  },
  {
    file: "packages/design-system/components/DropdownMenu/DropdownMenu.module.scss",
    pattern: "rgb(0 0 0 / 6%)",
    justification: "Compatibility fallback for the token-derived shadow layer on older Tauri webviews.",
  },
  {
    file: "packages/design-system/components/Tooltip/Tooltip.module.scss",
    pattern: "rgb(0 0 0 / 10%)",
    justification: "Compatibility fallback for the token-derived shadow layer on older Tauri webviews.",
  },
  {
    file: "packages/design-system/components/Tooltip/Tooltip.module.scss",
    pattern: "rgb(0 0 0 / 6%)",
    justification: "Compatibility fallback for the token-derived shadow layer on older Tauri webviews.",
  },
  {
    file: "*",
    pattern: "--motion-duration-fast",
    detector: "non-public-token",
    justification: "Motion timing is an internal performance/interaction contract, not a theme override surface.",
  },
  {
    file: "*",
    pattern: "--motion-duration-base",
    detector: "non-public-token",
    justification: "Motion timing is an internal performance/interaction contract, not a theme override surface.",
  },
  {
    file: "*",
    pattern: "--motion-ease-standard",
    detector: "non-public-token",
    justification: "Motion easing is an internal interaction contract, not a theme override surface.",
  },
];

const ROOTS = ["apps/desktop/src", "packages/canvas", "packages/editor", "packages/design-system/components"];

export function publicTokensFromMarkdown(markdown) {
  const section = markdown.match(/## Public tokens\s*([\s\S]*?)\n## /u)?.[1] ?? "";
  return new Set([...section.matchAll(/`(--[a-z0-9-]+)`/gu)].map((match) => match[1]));
}

export function generatedTokensFromCss(css) {
  return new Set([...css.matchAll(/\s(--[a-z0-9-]+):/gu)].map((match) => match[1]));
}

function sourceWithoutCommentsOrUrls(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\/|(^|\s)\/\/.*$/gmu, "$1")
    .replace(/(?:https?:\/\/|data:)[^\s'"`)}]+/giu, "");
}

function locations(source, expression) {
  return [...source.matchAll(expression)].map((match) => match[0]);
}

export function auditSource({ source, file, publicTokens, allowlist = [] }) {
  const clean = sourceWithoutCommentsOrUrls(source);
  const violations = [];
  const permitted = (value, detector) => allowlist.some((entry) =>
    (entry.file === file || entry.file === "*") && entry.pattern === value && (!entry.detector || entry.detector === detector),
  );
  const report = (detector, value) => violations.push({ detector, file, value });

  for (const match of clean.matchAll(TOKEN_REFERENCE)) {
    const token = match[1] ?? match[2];
    if (!publicTokens.has(token) && !permitted(token, "non-public-token")) report("non-public-token", token);
  }
  for (const match of clean.matchAll(TOKEN_DECLARATION)) {
    if (!publicTokens.has(match[1])) report("non-public-token-declaration", match[1]);
  }
  for (const fallback of locations(clean, FALLBACK)) report("var-fallback", fallback);
  for (const color of [...locations(clean, HEX_COLOR), ...locations(clean, COLOR_FUNCTION)]) {
    if (!permitted(color, "raw-color")) report("raw-color", color);
  }
  for (const named of locations(clean, NAMED_COLOR)) report("named-color", named);
  return violations;
}

function walk(directory, files) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "dist") walk(full, files);
    if (entry.isFile() && SOURCE_EXTENSIONS.test(entry.name) && !EXCLUDED_FILES.test(entry.name)) files.push(full);
  }
}

export function auditRepository({ root, allowlist = ALLOWLIST } = {}) {
  const markdown = fs.readFileSync(path.join(root, "packages/theme-api/PUBLIC_TOKENS.md"), "utf8");
  const generated = fs.readFileSync(path.join(root, "packages/design-system/tokens/dist/variables.css"), "utf8");
  const publicTokens = publicTokensFromMarkdown(markdown);
  const generatedTokens = generatedTokensFromCss(generated);
  const files = [];
  ROOTS.forEach((directory) => walk(path.join(root, directory), files));
  const violations = [];

  for (const token of publicTokens) {
    if (!generatedTokens.has(token)) violations.push({ detector: "contract-drift", file: "PUBLIC_TOKENS.md", value: token });
  }
  for (const entry of allowlist) {
    if (!entry.justification?.trim()) violations.push({ detector: "allowlist", file: entry.file, value: `missing justification for ${entry.pattern}` });
    else if (entry.file === "*") {
      const found = files.some((full) => fs.readFileSync(full, "utf8").includes(entry.pattern));
      if (!found) violations.push({ detector: "allowlist", file: entry.file, value: `stale entry for ${entry.pattern}` });
    } else {
      const full = path.join(root, entry.file);
      if (!fs.existsSync(full) || !fs.readFileSync(full, "utf8").includes(entry.pattern)) {
        violations.push({ detector: "allowlist", file: entry.file, value: `stale entry for ${entry.pattern}` });
      }
    }
  }
  for (const full of files) {
    violations.push(...auditSource({
      source: fs.readFileSync(full, "utf8"),
      file: path.relative(root, full),
      publicTokens,
      allowlist,
    }));
  }
  return { publicTokens, generatedTokens, violations };
}

function format({ detector, file, value }) {
  return `${file}: ${detector.replaceAll("-", " ")} ${value}`;
}

function main() {
  const result = auditRepository({ root: process.cwd() });
  for (const violation of result.violations) console.log(format(violation));
  console.log(`Public-token audit: ${result.violations.length} violation(s).`);
  if (result.violations.length > 0) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
