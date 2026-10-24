import { describe, expect, it } from "vitest";
import { createFilterRegistry } from "./filterRegistry";
import type { FilterArgument, FilterRuntime } from "./filterTypes";
import type { VariableValue } from "./VariableValue";

const runtime: FilterRuntime = { now: new Date(2026, 9, 17, 9, 5, 7) };
const filters = createFilterRegistry();

function run(
  name: string,
  value: VariableValue,
  args: FilterArgument[] = [],
  rt: FilterRuntime = runtime,
): VariableValue {
  return filters[name](value, args, rt);
}

describe("string filters", () => {
  it("changes case and trims", () => {
    expect(run("upper", "hi")).toBe("HI");
    expect(run("lower", "HI")).toBe("hi");
    expect(run("capitalize", "hELLO world")).toBe("Hello world");
    expect(run("title", "the quick brown fox")).toBe("The Quick Brown Fox");
    expect(run("trim", "  x  ")).toBe("x");
  });

  it("replaces literal and regex matches globally", () => {
    expect(run("replace", "a.b.c", [".", "-"])).toBe("a-b-c");
    expect(run("replace", "a1b2", ["/\\d/", "#"])).toBe("a#b#");
  });
});

describe("date filter", () => {
  it("formats values, explicit input formats, and falls back to now", () => {
    expect(run("date", "2026-10-17", ["YYYY/MM/DD"])).toBe("2026/10/17");
    expect(run("date", "10/17/2026", ["YYYY-MM-DD", "MM/DD/YYYY"])).toBe(
      "2026-10-17",
    );
    expect(run("date", "", ["YYYY-MM-DD"])).toBe("2026-10-17");
    expect(run("date", undefined, ["HH:mm"])).toBe("09:05");
  });
});

describe("array filters", () => {
  it("joins, splits, slices, and takes ends", () => {
    expect(run("join", ["a", "b"], [", "])).toBe("a, b");
    expect(run("split", "a b  c")).toEqual(["a", "b", "c"]);
    expect(run("split", "a1b2c", ["/\\d/"])).toEqual(["a", "b", "c"]);
    expect(run("slice", "abcdef", [1, 4])).toBe("bcd");
    expect(run("first", ["x", "y"])).toBe("x");
    expect(run("last", ["x", "y"])).toBe("y");
  });

  it("renders lists in each style", () => {
    expect(run("list", ["a", "b"])).toBe("- a\n- b");
    expect(run("list", ["a"], ["task"])).toBe("- [ ] a");
    expect(run("list", ["a"], ["numbered"])).toBe("1. a");
  });

  it("renders an object array as a table with header labels", () => {
    const rows = [
      { name: "a", role: "x" },
      { name: "b", role: "y" },
    ];
    expect(run("table", rows, ["Name", "Role"])).toBe(
      "| Name | Role |\n| --- | --- |\n| a | x |\n| b | y |",
    );
  });

  it("reads the text of highlight-like objects", () => {
    expect(run("list", [{ text: "quoted" }])).toBe("- quoted");
  });
});

describe("markdown filters", () => {
  it("renders wikilinks, images, links, quotes, and highlights", () => {
    expect(run("wikilink", "Note")).toBe("[[Note]]");
    expect(run("wikilink", "Note", ["Alias"])).toBe("[[Note|Alias]]");
    expect(run("wikilink", ["A", "B"])).toEqual(["[[A]]", "[[B]]"]);
    expect(run("wikilink", "Hostile]]Target\nMore", ["Bad]]Alias\nMore"])).toBe(
      "[[HostileTarget More|BadAlias More]]",
    );
    expect(run("highlight", "text")).toBe("==text==");
    expect(run("highlight", "a == b")).toBe("==a \\=\\= b==");
    expect(run("highlight", "line1\nline2")).toBe("==line1==\n==line2==");
    expect(run("highlight", ["item1", "item2"])).toEqual([
      "==item1==",
      "==item2==",
    ]);
    expect(run("image", "https://x/y.png", ["alt"])).toBe(
      "![alt](https://x/y.png)",
    );
    expect(run("link", "https://x", ["Text"])).toBe("[Text](https://x)");
    expect(run("blockquote", "a\nb")).toBe("> a\n> b");
  });

  it("uses the injected HTML→Markdown converter when present", () => {
    expect(run("markdown", "<b>hi</b>")).toBe("<b>hi</b>");
    const withConverter: FilterRuntime = {
      ...runtime,
      markdown: (html) => html.replace(/<[^>]+>/g, ""),
    };
    expect(run("markdown", "<b>hi</b>", [], withConverter)).toBe("hi");
  });
});

describe("safe_name filter", () => {
  it("strips path separators from hostile input", () => {
    expect(run("safe_name", "../../etc/passwd")).toBe("etcpasswd");
  });
});
