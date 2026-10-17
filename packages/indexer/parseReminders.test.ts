import { describe, expect, it } from "vitest";
import { parseReminders } from "./parseReminders";

describe("parseReminders", () => {
  it("parses a basic task with date and time", () => {
    const content = "- [ ] Call client (@2026-10-15 14:30)";
    const result = parseReminders(content, { tz: "UTC" });

    expect(result).toEqual([
      {
        line: 1,
        dueAtUtc: "2026-10-15T14:30:00.000Z",
        tz: "UTC",
        text: "Call client",
        done: false,
      },
    ]);
  });

  it("defaults to 09:00 for date-only reminders", () => {
    const content = "- [ ] Submit expense report (@2026-10-15)";
    const result = parseReminders(content, { tz: "UTC" });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      line: 1,
      dueAtUtc: "2026-10-15T09:00:00.000Z",
      tz: "UTC",
      text: "Submit expense report",
      done: false,
    });
  });

  it("handles custom default time", () => {
    const content = "- [ ] Morning standup (@2026-10-15)";
    const result = parseReminders(content, { tz: "UTC", defaultTime: "10:30" });

    expect(result[0].dueAtUtc).toBe("2026-10-15T10:30:00.000Z");
  });

  it("identifies done tasks for [x], [X], and [-]", () => {
    const content = [
      "- [x] Completed task 1 (@2026-10-15 09:00)",
      "- [X] Completed task 2 (@2026-10-15 10:00)",
      "- [-] Cancelled task (@2026-10-15 11:00)",
      "- [ ] Incomplete task (@2026-10-15 12:00)",
    ].join("\n");

    const result = parseReminders(content, { tz: "UTC" });
    expect(result).toHaveLength(4);
    expect(result[0].done).toBe(true);
    expect(result[1].done).toBe(true);
    expect(result[2].done).toBe(true);
    expect(result[3].done).toBe(false);
  });

  it("supports different list bullet formats and indentation", () => {
    const content = [
      "* [ ] Star bullet task (@2026-10-15 09:00)",
      "+ [ ] Plus bullet task (@2026-10-15 10:00)",
      "1. [ ] Ordered list task (@2026-10-15 11:00)",
      "  - [ ] Indented subtask (@2026-10-15 12:00)",
    ].join("\n");

    const result = parseReminders(content, { tz: "UTC" });
    expect(result).toHaveLength(4);
    expect(result[0].text).toBe("Star bullet task");
    expect(result[1].text).toBe("Plus bullet task");
    expect(result[2].text).toBe("Ordered list task");
    expect(result[3].text).toBe("Indented subtask");
  });

  it("ignores reminder text inside fenced code blocks", () => {
    const content = [
      "- [ ] Valid task (@2026-10-15 09:00)",
      "```markdown",
      "- [ ] Inside code block (@2026-10-15 10:00)",
      "```",
      "~~~",
      "- [ ] Inside tilde code (@2026-10-15 11:00)",
      "~~~",
      "- [ ] Another valid task (@2026-10-15 12:00)",
    ].join("\n");

    const result = parseReminders(content, { tz: "UTC" });
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("Valid task");
    expect(result[0].line).toBe(1);
    expect(result[1].text).toBe("Another valid task");
    expect(result[1].line).toBe(8);
  });

  it("ignores reminder text inside inline code", () => {
    const content = [
      "- [ ] Task with code `(@2026-10-15 10:00)` not a reminder",
      "- [ ] Task `with inline code` but valid reminder (@2026-10-15 09:00)",
    ].join("\n");

    const result = parseReminders(content, { tz: "UTC" });
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Task `with inline code` but valid reminder");
    expect(result[0].line).toBe(2);
  });

  it("ignores reminders in YAML frontmatter and preserves correct line numbers", () => {
    const content = [
      "---",
      "title: My Note",
      "reminder: (@2026-10-15 08:00)",
      "tags: [notes]",
      "---",
      "",
      "# Heading",
      "",
      "- [ ] Real reminder (@2026-10-15 09:00)",
    ].join("\n");

    const result = parseReminders(content, { tz: "UTC" });
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Real reminder");
    expect(result[0].line).toBe(9);
  });

  it("ignores non-task lines containing reminder tokens", () => {
    const content = [
      "Plain line with (@2026-10-15 09:00) reminder",
      "- Bullet without checkbox (@2026-10-15 09:00)",
      "- [ ] Real task (@2026-10-15 09:00)",
    ].join("\n");

    const result = parseReminders(content, { tz: "UTC" });
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Real task");
    expect(result[0].line).toBe(3);
  });

  it("safely ignores malformed dates and times without throwing", () => {
    const content = [
      "- [ ] Feb 31 invalid (@2026-02-31 09:00)",
      "- [ ] Month 13 invalid (@2026-13-01 09:00)",
      "- [ ] Day 0 invalid (@2026-01-00 09:00)",
      "- [ ] Hour 25 invalid (@2026-10-15 25:00)",
      "- [ ] Minute 60 invalid (@2026-10-15 12:60)",
      "- [ ] Nonsense date (@not-a-real-date)",
      "- [ ] Valid task (@2026-10-15 09:00)",
    ].join("\n");

    expect(() => parseReminders(content, { tz: "UTC" })).not.toThrow();
    const result = parseReminders(content, { tz: "UTC" });
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Valid task");
    expect(result[0].line).toBe(7);
  });

  it("handles explicit timezone offsets and names in token", () => {
    const content = [
      "- [ ] UTC explicit (@2026-10-15 10:00 Z)",
      "- [ ] Offset explicit (@2026-10-15 12:00 +02:00)",
    ].join("\n");

    const result = parseReminders(content);
    expect(result).toHaveLength(2);
    expect(result[0].dueAtUtc).toBe("2026-10-15T10:00:00.000Z");
    expect(result[1].dueAtUtc).toBe("2026-10-15T10:00:00.000Z");
  });

  it("cleans task text cleanly regardless of token placement", () => {
    const content = [
      "- [ ] (@2026-10-15 09:00) Token at beginning",
      "- [ ] Token in (@2026-10-15 09:00) the middle of sentence",
      "- [ ] Token at end (@2026-10-15 09:00)",
      "- [ ] (@2026-10-15 09:00)",
    ].join("\n");

    const result = parseReminders(content, { tz: "UTC" });
    expect(result[0].text).toBe("Token at beginning");
    expect(result[1].text).toBe("Token in the middle of sentence");
    expect(result[2].text).toBe("Token at end");
    expect(result[3].text).toBe("");
  });

  it("returns empty array immediately when content lacks reminder token", () => {
    const content = "# Large document\nNo reminders anywhere here.";
    expect(parseReminders(content)).toEqual([]);
  });

  it("benchmarks parsing time delta across 10,000 notes", () => {
    const notes: string[] = [];
    for (let i = 0; i < 10000; i++) {
      let content = `# Note ${i}\n\nHere is paragraph text with [[link]] and #tag.\n\n- [ ] Plain task 1\n- [ ] Plain task 2\n`;
      if (i % 20 === 0) {
        content += `- [ ] Milestone task (@2026-10-15 09:00)\n- [x] Completed task (@2026-10-14)\n`;
      }
      notes.push(content);
    }

    const t0 = performance.now();
    let remindersFound = 0;
    for (const content of notes) {
      remindersFound += parseReminders(content).length;
    }
    const t1 = performance.now();
    const durationMs = t1 - t0;

    console.log(
      `[benchmark] 10,000 notes parsed in ${durationMs.toFixed(2)} ms (${(durationMs / 10000).toFixed(4)} ms/note). Reminders extracted: ${remindersFound}`,
    );
    expect(remindersFound).toBe(1000);
    expect(durationMs).toBeLessThan(1000);
  });
});
