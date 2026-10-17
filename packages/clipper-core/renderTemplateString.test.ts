import { describe, expect, it } from "vitest";
import { createFilterRegistry } from "./filterRegistry";
import type { VariableValue } from "./VariableValue";
import {
  parseTemplateString,
  renderTemplateString,
  stringifyValue,
  type RenderContext,
} from "./renderTemplateString";

function context(preset: Record<string, VariableValue> = {}): RenderContext {
  return {
    variables: { preset },
    filters: createFilterRegistry(),
    runtime: { now: new Date(2026, 9, 17, 9, 5, 7) },
  };
}

describe("parseTemplateString", () => {
  it("splits literal text and expressions", () => {
    const segments = parseTemplateString("Hi {{title}}!");
    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ kind: "text", value: "Hi " });
    expect(segments[1]).toMatchObject({ kind: "expression" });
    expect(segments[2]).toEqual({ kind: "text", value: "!" });
  });

  it("treats an unbalanced opener as literal text", () => {
    expect(parseTemplateString("a {{title")).toEqual([
      { kind: "text", value: "a {{title" },
    ]);
  });
});

describe("stringifyValue", () => {
  it("renders primitives, arrays and missing values", () => {
    expect(stringifyValue(undefined)).toBe("");
    expect(stringifyValue(null)).toBe("");
    expect(stringifyValue(3)).toBe("3");
    expect(stringifyValue(["a", "b"])).toBe("a\nb");
  });
});

describe("renderTemplateString", () => {
  it("renders variables and applies filters", () => {
    expect(
      renderTemplateString("{{title|upper}}", context({ title: "hello" })),
    ).toBe("HELLO");
  });

  it("renders an empty string for an unknown variable", () => {
    expect(renderTemplateString("[{{missing}}]", context())).toBe("[]");
  });

  it("ignores unknown filters rather than failing", () => {
    expect(
      renderTemplateString("{{title|nope}}", context({ title: "x" })),
    ).toBe("x");
  });

  it("makes deferred prompt variables visible instead of silently empty", () => {
    expect(renderTemplateString('{{"summarize"}}', context())).toBe(
      "[unsupported prompt variable]",
    );
  });
});
