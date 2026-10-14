import { describe, it, expect } from "vitest";
import { toggleReminderInMarkdown } from "./reminderTaskActions";

describe("reminderTaskActions — toggleReminderInMarkdown", () => {
  it("toggles task from open to done by line index", () => {
    const markdown = `# Title\n\n- [ ] Buy milk (@2026-10-25 10:00)\n- [ ] Walk dog`;
    const updated = toggleReminderInMarkdown(
      markdown,
      { line: 3, text: "Buy milk" },
      true,
    );
    expect(updated).toBe(
      `# Title\n\n- [x] Buy milk (@2026-10-25 10:00)\n- [ ] Walk dog`,
    );
  });

  it("toggles task from done to open by line index", () => {
    const markdown = `- [x] Buy milk (@2026-10-25 10:00)`;
    const updated = toggleReminderInMarkdown(
      markdown,
      { line: 1, text: "Buy milk" },
      false,
    );
    expect(updated).toBe(`- [ ] Buy milk (@2026-10-25 10:00)`);
  });

  it("handles line shift via text fallback matching", () => {
    // line param points to line 1, but actual task is on line 4
    const markdown = `# Intro\nExtra line 1\nExtra line 2\n- [ ] Pay bills (@2026-10-20)`;
    const updated = toggleReminderInMarkdown(
      markdown,
      { line: 1, text: "Pay bills" },
      true,
    );
    expect(updated).toBe(
      `# Intro\nExtra line 1\nExtra line 2\n- [x] Pay bills (@2026-10-20)`,
    );
  });

  it("preserves CRLF line endings", () => {
    const markdown = `# Title\r\n- [ ] Task 1 (@2026-10-20)\r\n- [ ] Task 2`;
    const updated = toggleReminderInMarkdown(
      markdown,
      { line: 2, text: "Task 1" },
      true,
    );
    expect(updated).toBe(
      `# Title\r\n- [x] Task 1 (@2026-10-20)\r\n- [ ] Task 2`,
    );
  });

  it("returns unchanged content if task text is not found", () => {
    const markdown = `- [ ] Existing task`;
    const updated = toggleReminderInMarkdown(
      markdown,
      { line: 1, text: "Nonexistent task" },
      true,
    );
    expect(updated).toBe(markdown);
  });
});
