import { describe, expect, it } from "vitest";
import {
  parseNoteTodos,
  toggleTodoInContent,
  updateTodoTextInContent,
  addLinkToTodoInContent,
  addReminderToTodoInContent,
  appendTodoToSectionInContent,
} from "./todoParser";

const SAMPLE_NOTE = `
# Admin Dashboard
business intelligence suites

## V1 Concepts
- [ ] Create wireframes for new dash [01 Aug]
- [ ] Outline in UX guide where new branches should be [[UX Guide]]
- [ ] 🚩 Update research document [:= 3]

## Icons
- [x] Create design system for icon styles [[Design System]]

## Animation Transitions
- [ ] Create animatic
- [ ] Export intro in 1920 x 1080 (Animation) (@2026-11-15 10:00)
`;

describe("todoParser", () => {
  it("parses sections and todos with metadata accurately", () => {
    const sections = parseNoteTodos(SAMPLE_NOTE, "todos/Design/Admin Dashboard.md", "Design", "Admin Dashboard");
    expect(sections).toHaveLength(3);

    const v1 = sections[0];
    expect(v1.name).toBe("V1 Concepts");
    expect(v1.todos).toHaveLength(3);
    expect(v1.todos[0].text).toBe("Create wireframes for new dash");
    expect(v1.todos[0].dueDate).toBe("01 Aug");
    expect(v1.todos[0].month).toBe("Aug");
    expect(v1.todos[0].completed).toBe(false);

    expect(v1.todos[1].text).toBe("Outline in UX guide where new branches should be");
    expect(v1.todos[1].linkedNotePath).toBe("UX Guide");

    expect(v1.todos[2].text).toBe("🚩 Update research document");
    expect(v1.todos[2].subtasksCount).toBe(3);

    const icons = sections[1];
    expect(icons.todos[0].completed).toBe(true);

    const anim = sections[2];
    expect(anim.todos[1].label).toBe("Animation");
    expect(anim.todos[1].hasReminder).toBe(true);
    expect(anim.todos[1].dueDate).toBe("2026-11-15");
    expect(anim.todos[1].month).toBe("2026-11");
  });

  it("toggles todo item completion in markdown", () => {
    const toggled = toggleTodoInContent(SAMPLE_NOTE, 5, true);
    expect(toggled).toContain("- [x] Create wireframes for new dash");

    const untoggled = toggleTodoInContent(toggled, 5, false);
    expect(untoggled).toContain("- [ ] Create wireframes for new dash");
  });

  it("updates todo text in markdown", () => {
    const updated = updateTodoTextInContent(SAMPLE_NOTE, 5, "Create wireframes v2");
    expect(updated).toContain("- [ ] Create wireframes v2");
  });

  it("adds linked note wikilink to todo", () => {
    const linked = addLinkToTodoInContent(SAMPLE_NOTE, 5, "My Note");
    expect(linked).toContain("[[My Note]]");
  });

  it("adds reminder timestamp to todo", () => {
    const reminded = addReminderToTodoInContent(SAMPLE_NOTE, 5, "2026-12-01 09:00");
    expect(reminded).toContain("(@2026-12-01 09:00)");
  });

  it("appends new todo into existing or new section", () => {
    const appended = appendTodoToSectionInContent(SAMPLE_NOTE, "Icons", "New icon test");
    expect(appended).toContain("- [ ] New icon test");

    const withNewSection = appendTodoToSectionInContent(SAMPLE_NOTE, "Brand", "Brand guidelines");
    expect(withNewSection).toContain("## Brand\n- [ ] Brand guidelines");
  });
});
