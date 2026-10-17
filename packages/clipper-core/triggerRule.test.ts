import { describe, expect, it } from "vitest";
import {
  MAX_REGEX_SOURCE_LENGTH,
  MAX_TRIGGER_LENGTH,
  parseTriggerRule,
  triggerRuleError,
} from "./triggerRule";

function rule(raw: string) {
  const parsed = parseTriggerRule(raw);
  return parsed.status === "ok" ? parsed.rule : undefined;
}

describe("parseTriggerRule", () => {
  it("reads the three documented rule shapes", () => {
    expect(rule("schema:@Recipe")).toEqual({ kind: "schema", type: "Recipe" });
    expect(rule("schema:Recipe")).toEqual({ kind: "schema", type: "Recipe" });
    expect(rule("/^https:\\/\\/news\\./i")).toEqual({
      kind: "regex",
      source: "^https:\\/\\/news\\.",
      flags: "i",
    });
    expect(rule("https://blog.example/")).toEqual({
      kind: "prefix",
      prefix: "https://blog.example/",
    });
  });

  it("trims surrounding whitespace, as an imported file may carry it", () => {
    expect(rule("  schema:@Recipe  ")).toEqual({
      kind: "schema",
      type: "Recipe",
    });
  });

  it("reports an empty rule rather than matching everything", () => {
    expect(parseTriggerRule("   ")).toEqual({ status: "empty" });
    expect(triggerRuleError("")).toBe("is empty");
  });

  it("refuses an unclosed or unknown-flag pattern instead of reading it as a prefix", () => {
    expect(triggerRuleError("/^https://news")).toContain("not a closed");
    expect(triggerRuleError("/news/z")).toContain("not a closed");
    expect(triggerRuleError("/(/")).toContain("not a valid regular expression");
  });

  it("refuses a rule or pattern that is too long to be deliberate", () => {
    expect(
      triggerRuleError(`https://example.com/${"a".repeat(MAX_TRIGGER_LENGTH)}`),
    ).toContain("longer than");
    const pattern = `/^${"a".repeat(MAX_REGEX_SOURCE_LENGTH)}$/`;
    expect(triggerRuleError(pattern)).toContain("longer than");
  });

  it("refuses the backtracking shapes that could freeze the popup", () => {
    expect(triggerRuleError("/(a+)+$/")).toContain("hang the browser");
    expect(triggerRuleError("/(a|aa)+$/")).toContain("hang the browser");
    expect(triggerRuleError("/a**/")).toContain("hang the browser");
    expect(triggerRuleError("/(a+)*?$/")).toContain("hang the browser");
  });

  it("accepts the ordinary patterns people actually write", () => {
    expect(triggerRuleError("/^https?:\\/\\/(www\\.)?example\\.com\\//")).toBe(
      undefined,
    );
    expect(triggerRuleError("/^\\d{4}-\\d{2}-\\d{2}$/")).toBe(undefined);
    expect(triggerRuleError("/(?:docs|blog)\\/post\\//")).toBe(undefined);
    expect(triggerRuleError("/^https:\\/\\/example\\.com\\/a*?b/")).toBe(
      undefined,
    );
  });

  it("names the missing schema type", () => {
    expect(triggerRuleError("schema:@")).toContain("names no type");
  });
});
