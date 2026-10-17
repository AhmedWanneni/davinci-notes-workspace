// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { reminderExtension } from "./reminderExtension";
import { reminderTheme } from "../theme/reminderTheme";

function createView(doc: string, onReminderClick = vi.fn()) {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const state = EditorState.create({
    doc,
    extensions: [
      markdown(),
      reminderTheme,
      reminderExtension({ onReminderClick }),
    ],
  });

  const view = new EditorView({
    state,
    parent: container,
  });

  return { view, container, onReminderClick };
}

describe("reminderExtension", () => {
  it("renders a reminder token as a chip with relative/absolute time", () => {
    // 2026-10-25 is Oct 25
    const { container } = createView("Task line (@2026-10-25 14:30)");
    const chip = container.querySelector(".cm-reminder-chip");
    expect(chip).not.toBeNull();
    expect(chip?.textContent).toContain("Oct 25");
    expect(chip?.textContent).toContain("2:30 PM");
  });

  it("applies overdue styling when past-due and incomplete", () => {
    // 2020 is in the past
    const { container } = createView("- [ ] Buy groceries (@2020-01-01 09:00)");
    const chip = container.querySelector(".cm-reminder-chip");
    expect(chip).not.toBeNull();
    expect(chip?.classList.contains("cm-reminder-overdue")).toBe(true);
  });

  it("does not apply overdue styling when the task is completed", () => {
    const { container } = createView("- [x] Done task (@2020-01-01 09:00)");
    const chip = container.querySelector(".cm-reminder-chip");
    expect(chip).not.toBeNull();
    expect(chip?.classList.contains("cm-reminder-overdue")).toBe(false);
    expect(chip?.classList.contains("cm-reminder-done")).toBe(true);
  });

  it("does not render chip inside fenced code blocks, inline code, or frontmatter", () => {
    const doc = [
      "---",
      "reminder: (@2026-10-15)",
      "---",
      "",
      "```",
      "inside code block (@2026-10-15)",
      "```",
      "",
      "Inline `(@2026-10-15)` token.",
      "",
      "Valid task (@2026-10-15).",
    ].join("\n");

    const { container } = createView(doc);
    const chips = container.querySelectorAll(".cm-reminder-chip");
    expect(chips.length).toBe(1);
    expect(chips[0]?.getAttribute("title")).toContain("2026-10-15");
  });

  it("reveals raw token when cursor is placed on it (cursor gating)", () => {
    const doc = "Task line (@2026-10-15)";
    const { view, container } = createView(doc);

    // Initial state: cursor at 0, chip is visible
    expect(container.querySelector(".cm-reminder-chip")).not.toBeNull();

    // Move cursor inside token: position 14 (between '(' and ')')
    view.dispatch({
      selection: { anchor: 14, head: 14 },
    });

    // Chip should be hidden, raw markdown token revealed
    expect(container.querySelector(".cm-reminder-chip")).toBeNull();

    // Move cursor away to end of line
    view.dispatch({
      selection: { anchor: 0, head: 0 },
    });

    // Chip reappears
    expect(container.querySelector(".cm-reminder-chip")).not.toBeNull();
  });

  it("invokes onReminderClick when chip is clicked", () => {
    const onReminderClick = vi.fn();
    const doc = "- [ ] Call Alice (@2026-10-15 10:00)";
    const { container } = createView(doc, onReminderClick);

    const chip = container.querySelector(".cm-reminder-chip") as HTMLElement;
    expect(chip).not.toBeNull();

    chip.click();

    expect(onReminderClick).toHaveBeenCalledTimes(1);
    const callArg = onReminderClick.mock.calls[0]?.[0];
    expect(callArg?.date).toBe("2026-10-15");
    expect(callArg?.time).toBe("10:00");
    expect(callArg?.rawToken).toBe("(@2026-10-15 10:00)");
  });
});
