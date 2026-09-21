import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { validateThemeManifest } from "./validateThemeManifest.js";

async function fixture(name: string): Promise<unknown> {
  const raw = await readFile(
    new URL(`./fixtures/${name}`, import.meta.url),
    "utf8",
  );
  return JSON.parse(raw) as unknown;
}

describe("validateThemeManifest", () => {
  it("accepts the complete fixture manifest", async () =>
    expect(
      validateThemeManifest(await fixture("valid-manifest.json")).success,
    ).toBe(true));
  it("rejects a missing required field with a clear error", async () => {
    const result = validateThemeManifest(
      await fixture("missing-styles-manifest.json"),
    );
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.errors).toContainEqual({
        field: "styles",
        message: 'Required field "styles" is missing or empty.',
      });
  });
  it("rejects the non-SemVer fixture version", async () => {
    const result = validateThemeManifest(
      await fixture("invalid-version-manifest.json"),
    );
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.errors.map(({ field }) => field)).toContain("version");
  });
  it("accepts a stylesheet that uses only public tokens", async () => {
    const manifest = validateThemeManifest(
      await fixture("valid-manifest.json"),
    );
    const styles = await readFile(
      new URL("./fixtures/public-token-theme/styles.css", import.meta.url),
      "utf8",
    );
    expect(manifest.success).toBe(true);
    expect(
      [...styles.matchAll(/--[a-z0-9-]+(?=\s*:)/gu)].map(([token]) => token),
    ).toEqual([
      "--color-bg-scrim",
      "--color-bg-primary",
      "--color-text-normal",
      "--color-interactive-accent",
      "--border-radius-md",
      "--font-ui",
    ]);
  });
  it("rejects stylesheet paths that escape the package", async () => {
    const result = validateThemeManifest({
      ...((await fixture("valid-manifest.json")) as Record<string, unknown>),
      styles: "../theme.css",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.errors.map(({ field }) => field)).toContain("styles");
  });
  it("records the internal-token fixture as outside the public contract", async () => {
    const styles = await readFile(
      new URL("./fixtures/internal-token-theme/styles.css", import.meta.url),
      "utf8",
    );
    expect(styles).toContain("--motion-duration-fast");
    expect(styles).not.toContain("--color-interactive-accent");
  });
});
