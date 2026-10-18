import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { ALLOWLIST, auditRepository, auditSource, generatedTokensFromCss, publicTokensFromMarkdown } from "./check-public-tokens.mjs";

const fixtureRoot = path.join(process.cwd(), "scripts/fixtures/public-token-guard");
const publicTokens = new Set(["--color-text-normal", "--color-bg-primary"]);
const fixture = (name) => fs.readFileSync(path.join(fixtureRoot, name), "utf8");
const detectors = (name) => auditSource({ source: fixture(name), file: name, publicTokens }).map(({ detector }) => detector);

test("does not flag selectors, comments, URLs, transparent, or currentColor", () => {
  assert.deepEqual(detectors("safe.scss"), []);
});

test("flags each forbidden feature-code form", () => {
  assert.ok(detectors("legacy.scss").includes("non-public-token"));
  assert.ok(detectors("fallback.scss").includes("var-fallback"));
  assert.ok(detectors("colors.scss").includes("raw-color"));
  assert.ok(detectors("inline.tsx").includes("raw-color"));
  assert.ok(detectors("canvas.ts").includes("raw-color"));
  assert.ok(detectors("set-property.ts").includes("non-public-token"));
  assert.equal(detectors("named.scss").filter((detector) => detector === "named-color").length, 3);
});

test("the documented contract agrees with generated output", () => {
  const root = process.cwd();
  const markdown = fs.readFileSync(path.join(root, "packages/theme-api/PUBLIC_TOKENS.md"), "utf8");
  const generated = fs.readFileSync(path.join(root, "packages/design-system/tokens/dist/variables.css"), "utf8");
  for (const token of publicTokensFromMarkdown(markdown)) assert.ok(generatedTokensFromCss(generated).has(token), token);
});

test("allowlist entries require a justification and must match", () => {
  const root = process.cwd();
  const missing = auditRepository({ root, allowlist: [{ ...ALLOWLIST[0], justification: "" }] }).violations;
  const stale = auditRepository({ root, allowlist: [{ ...ALLOWLIST[0], pattern: "#deadbeef" }] }).violations;
  assert.ok(missing.some(({ detector, value }) => detector === "allowlist" && value.startsWith("missing justification")));
  assert.ok(stale.some(({ detector, value }) => detector === "allowlist" && value.startsWith("stale entry")));
});

test("allows the documented runtime editor setting", () => {
  const source = 'fontSize: "var(--editor-font-size)"';
  const violations = auditSource({
    source,
    file: "packages/editor/theme/editorTheme.ts",
    publicTokens,
    allowlist: ALLOWLIST,
  });
  assert.deepEqual(violations, []);
});
