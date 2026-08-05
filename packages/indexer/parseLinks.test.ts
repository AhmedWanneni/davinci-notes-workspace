import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseLinks } from "./parseLinks";

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures/vault",
);

const VAULT_PATHS = [
  "projects/alpha.md",
  "projects/beta-overview.md",
  "specs/gamma.md",
  "daily/standalone.md",
] as const;

function readFixture(relativePath: string): string {
  return readFileSync(join(FIXTURES, relativePath), "utf8");
}

describe("parseLinks", () => {
  it("parses a plain wikilink", () => {
    const links = parseLinks("See [[beta-overview]] for details.", {
      notePaths: VAULT_PATHS,
      sourcePath: "projects/alpha.md",
    });

    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      type: "wikilink",
      targetRaw: "beta-overview",
      target: "projects/beta-overview.md",
      resolved: true,
    });
  });

  it("parses wikilink with display alias", () => {
    const links = parseLinks("Read [[beta-overview|the beta write-up]] next.", {
      notePaths: VAULT_PATHS,
      sourcePath: "projects/alpha.md",
    });

    expect(links[0]).toMatchObject({
      displayText: "the beta write-up",
      target: "projects/beta-overview.md",
      resolved: true,
    });
  });

  it("parses wikilink with heading fragment", () => {
    const links = parseLinks("Jump to [[beta-overview#Architecture]].", {
      notePaths: VAULT_PATHS,
      sourcePath: "projects/alpha.md",
    });

    expect(links[0]).toMatchObject({
      heading: "Architecture",
      target: "projects/beta-overview.md",
      resolved: true,
    });
  });

  it("parses wikilink with block reference", () => {
    const links = parseLinks("Pin [[beta-overview#^intro-block]] here.", {
      notePaths: VAULT_PATHS,
      sourcePath: "projects/alpha.md",
    });

    expect(links[0]).toMatchObject({
      blockId: "intro-block",
      target: "projects/beta-overview.md",
      resolved: true,
    });
  });

  it("parses standard markdown relative links", () => {
    const links = parseLinks("[gamma spec](../specs/gamma.md)", {
      notePaths: VAULT_PATHS,
      sourcePath: "projects/alpha.md",
    });

    expect(links[0]).toMatchObject({
      type: "markdown",
      displayText: "gamma spec",
      target: "specs/gamma.md",
      resolved: true,
    });
  });

  it("returns unresolved wikilinks when the target note does not exist", () => {
    const links = parseLinks("Plan [[delta-roadmap]] soon.", {
      notePaths: VAULT_PATHS,
      sourcePath: "projects/alpha.md",
    });

    expect(links[0]).toMatchObject({
      targetRaw: "delta-roadmap",
      target: "delta-roadmap",
      resolved: false,
    });
  });

  it("resolves note names case-insensitively", () => {
    const links = parseLinks("Back to [[ALPHA]]", {
      notePaths: VAULT_PATHS,
      sourcePath: "projects/beta-overview.md",
    });

    expect(links[0]).toMatchObject({
      target: "projects/alpha.md",
      resolved: true,
    });
  });

  it("returns zero links for a note with no links", () => {
    const content = readFixture("daily/standalone.md");
    const links = parseLinks(content, {
      notePaths: VAULT_PATHS,
      sourcePath: "daily/standalone.md",
    });

    expect(links).toHaveLength(0);
  });

  it("parses mixed link types from a realistic project note", () => {
    const content = readFixture("projects/alpha.md");
    const links = parseLinks(content, {
      notePaths: VAULT_PATHS,
      sourcePath: "projects/alpha.md",
    });

    const wikilinks = links.filter((link) => link.type === "wikilink");
    const markdownLinks = links.filter((link) => link.type === "markdown");

    expect(wikilinks).toHaveLength(5);
    expect(markdownLinks).toHaveLength(2);

    expect(wikilinks.some((link) => link.blockId === "intro-block")).toBe(true);
    expect(wikilinks.some((link) => link.heading === "Architecture")).toBe(
      true,
    );
    expect(
      wikilinks.some(
        (link) => !link.resolved && link.targetRaw === "delta-roadmap",
      ),
    ).toBe(true);

    expect(
      markdownLinks.some(
        (link) => link.resolved && link.target === "specs/gamma.md",
      ),
    ).toBe(true);
    expect(
      markdownLinks.some(
        (link) => !link.resolved && link.targetRaw.includes("tauri"),
      ),
    ).toBe(true);

    expect(links.some((link) => link.targetRaw === "ignored-wikilink")).toBe(
      false,
    );
    expect(links.some((link) => link.targetRaw === "ghost-note")).toBe(false);
  });
});
