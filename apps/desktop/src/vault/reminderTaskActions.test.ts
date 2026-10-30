import { describe, it, expect } from "vitest";
import {
  toggleReminderInMarkdown,
  editReminderInMarkdown,
  deleteReminderInMarkdown,
  addReminderToMarkdown,
} from "./reminderTaskActions";

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

  it("rolls recurring reminder due date forward in-place and keeps checkbox open", () => {
    const markdown = `- [ ] Weekly sprint (@2026-10-14 10:00 /weekly)`;
    const updated = toggleReminderInMarkdown(
      markdown,
      { line: 1, text: "Weekly sprint" },
      true,
    );
    expect(updated).toBe(`- [ ] Weekly sprint (@2026-10-21 10:00 /weekly)`);
  });

  it("completing a recurring reminder three times in a row advances correctly", () => {
    let markdown = `- [ ] Daily standup (@2026-10-14 09:30 /daily)`;
    markdown = toggleReminderInMarkdown(markdown, { line: 1, text: "Daily standup" }, true);
    expect(markdown).toBe(`- [ ] Daily standup (@2026-10-15 09:30 /daily)`);

    markdown = toggleReminderInMarkdown(markdown, { line: 1, text: "Daily standup" }, true);
    expect(markdown).toBe(`- [ ] Daily standup (@2026-10-16 09:30 /daily)`);

    markdown = toggleReminderInMarkdown(markdown, { line: 1, text: "Daily standup" }, true);
    expect(markdown).toBe(`- [ ] Daily standup (@2026-10-17 09:30 /daily)`);
  });
});

describe("reminderTaskActions — edit, delete, add", () => {
  it("edits reminder text and token while preserving checkbox state", () => {
    const markdown = `# Notes\n- [ ] Initial reminder (@2026-10-20)\n- [x] Done item`;
    const updated = editReminderInMarkdown(
      markdown,
      { line: 2, text: "Initial reminder" },
      { text: "Updated reminder", dueToken: "@2026-10-25 15:00 /daily" },
    );
    expect(updated).toBe(
      `# Notes\n- [ ] Updated reminder (@2026-10-25 15:00 /daily)\n- [x] Done item`,
    );
  });

  it("deletes a reminder task line", () => {
    const markdown = `# Notes\n- [ ] Keep 1\n- [ ] Delete me (@2026-10-20)\n- [ ] Keep 2`;
    const updated = deleteReminderInMarkdown(markdown, {
      line: 3,
      text: "Delete me",
    });
    expect(updated).toBe(`# Notes\n- [ ] Keep 1\n- [ ] Keep 2`);
  });

  it("adds a reminder to empty content and existing content", () => {
    expect(
      addReminderToMarkdown("", {
        text: "Brand new",
        dueToken: "@2026-10-30 09:00",
      }),
    ).toBe("- [ ] Brand new (@2026-10-30 09:00)");

    expect(
      addReminderToMarkdown("# Notes\n", {
        text: "Second task",
        dueToken: "@2026-11-01",
      }),
    ).toBe("# Notes\n- [ ] Second task (@2026-11-01)\n");
  });
});
