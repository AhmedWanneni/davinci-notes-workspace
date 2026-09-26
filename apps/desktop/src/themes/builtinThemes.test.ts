import { readFile } from "node:fs/promises";
import { validateThemeManifest } from "@app/theme-api";
import { describe, expect, it } from "vitest";

const root = new URL("../../../../packages/builtin-themes/", import.meta.url);
const themeDirectories = [
  "light-a",
  "catppuccin-latte",
  "catppuccin-frappe",
  "dark-b",
];
const requiredColors = [
  "--color-bg-scrim",
  "--color-bg-status-accent",
  "--color-bg-status-success",
  "--color-bg-status-warning",
  "--color-bg-status-error",
  "--color-border-status-accent",
  "--color-border-status-success",
  "--color-border-status-warning",
  "--color-border-status-error",
  "--color-shadow",
];

async function publicTokens(): Promise<Set<string>> {
  const markdown = await readFile(
    new URL("../../../../packages/theme-api/PUBLIC_TOKENS.md", import.meta.url),
    "utf8",
  );
  const section =
    markdown.match(/## Public tokens\s*([\s\S]*?)\n## /u)?.[1] ?? "";
  return new Set(
    [...section.matchAll(/`(--[a-z0-9-]+)`/gu)].map(([, token]) => token),
  );
}

describe("built-in themes", () => {
  it.each(themeDirectories)(
    "validates %s and stays within the public contract",
    async (directory) => {
      const manifest = JSON.parse(
        await readFile(new URL(`${directory}/manifest.json`, root), "utf8"),
      ) as unknown;
      const validation = validateThemeManifest(manifest);
      const css = await readFile(
        new URL(`${directory}/theme.css`, root),
        "utf8",
      );
      const contract = await publicTokens();
      const declarations = [...css.matchAll(/--[a-z0-9-]+(?=\s*:)/gu)].map(
        ([token]) => token,
      );

      expect(validation.success).toBe(true);
      expect(declarations.every((token) => contract.has(token))).toBe(true);
      expect(
        requiredColors.every((token) => declarations.includes(token)),
      ).toBe(true);
      expect(css).not.toMatch(/@import|url\(/iu);
    },
  );
});
