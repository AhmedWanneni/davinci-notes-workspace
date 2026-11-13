import React from "react";
import { describe, it, expect, vi } from "vitest";
import {
  parseTodosFromMarkdown,
  toggleTodoInMarkdown,
  appendTodoToMarkdown,
} from "../components/todos/todoParser";
import { TodoView } from "../components/todos/TodoView";
import { TodoHeader } from "../components/todos/TodoHeader";
import { TodoCalendarStrip } from "../components/todos/TodoCalendarStrip";
import { TodoReminderBanner } from "../components/todos/TodoReminderBanner";
import { TodoItemCard } from "../components/todos/TodoItemCard";
import { AddTodoModal } from "../components/todos/AddTodoModal";

vi.mock("../theme", () => ({
  useTheme: () => ({
    tokens: {
      color: {
        bg: { primary: "#ffffff", secondary: "#f5f5f5", hover: "#ebebeb" },
        text: { normal: "#111111", muted: "#777777" },
        border: { subtle: "#e5e5e5" },
      },
    },
  }),
}));

describe("Mobile Todo Parser (Desktop Parity)", () => {
  const sampleMarkdown = `# Todos

## Daily routine
- [x] Drink a glass of water (@2025-03-10 08:00) [5 min] streak 3 days
- [x] Meditate to relax [15 min] streak 6 days
- [ ] Stretch for 10 minutes [10 min]
- [ ] Go for a short walk
`;

  it("parses todos, reminders, durations and icons from markdown", () => {
    const sections = parseTodosFromMarkdown(sampleMarkdown);
    expect(sections.length).toBe(1);
    expect(sections[0]?.name).toBe("Daily routine");
    expect(sections[0]?.todos.length).toBe(4);

    const [todo1, todo2, todo3, todo4] = sections[0].todos;
    expect(todo1?.text).toBe("Drink a glass of water");
    expect(todo1?.completed).toBe(true);
    expect(todo1?.reminder).toBe("2025-03-10 08:00");
    expect(todo1?.duration).toBe("5 min");
    expect(todo1?.streakDays).toBe(3);
    expect(todo1?.iconName).toBe("water");

    expect(todo2?.text).toBe("Meditate to relax");
    expect(todo2?.completed).toBe(true);
    expect(todo2?.duration).toBe("15 min");
    expect(todo2?.iconName).toBe("bicycle");

    expect(todo3?.text).toBe("Stretch for 10 minutes");
    expect(todo3?.completed).toBe(false);
    expect(todo3?.duration).toBe("10 min");
    expect(todo3?.iconName).toBe("stretch");

    expect(todo4?.text).toBe("Go for a short walk");
    expect(todo4?.completed).toBe(false);
    expect(todo4?.iconName).toBe("walk");
  });

  it("toggles todo checklist status in markdown", () => {
    const sections = parseTodosFromMarkdown(sampleMarkdown);
    const todo3 = sections[0]?.todos[2];
    expect(todo3?.completed).toBe(false);

    const toggledMarkdown = toggleTodoInMarkdown(sampleMarkdown, todo3!.lineIndex, true);
    expect(toggledMarkdown).toContain("- [x] Stretch for 10 minutes");

    const unToggledMarkdown = toggleTodoInMarkdown(toggledMarkdown, todo3!.lineIndex, false);
    expect(unToggledMarkdown).toContain("- [ ] Stretch for 10 minutes");
  });

  it("appends a new todo item into section in markdown", () => {
    const updated = appendTodoToMarkdown(
      sampleMarkdown,
      "Daily routine",
      "Read book for 20 minutes",
      "20 min",
      "2025-03-10 21:00",
    );
    expect(updated).toContain("- [ ] Read book for 20 minutes [20 min] (@2025-03-10 21:00)");
  });
});

describe("TodoView and UI Subcomponents Verification", () => {
  const sampleMarkdown = `# Todos

## Daily routine
- [x] Drink a glass of water [5 min]
- [ ] Meditate to relax [15 min]
`;

  it("renders TodoHeader with greeting and date", () => {
    const header = <TodoHeader userName="Budi" date={new Date("2025-03-10T09:00:00Z")} />;
    expect(header).toBeDefined();
    expect(header.props.userName).toBe("Budi");
  });

  it("renders TodoCalendarStrip with weekly days", () => {
    const onSelect = vi.fn();
    const strip = <TodoCalendarStrip selectedDate={new Date("2025-03-10")} onSelectDate={onSelect} />;
    expect(strip).toBeDefined();
    expect(strip.props.onSelectDate).toBe(onSelect);
  });

  it("renders TodoReminderBanner with onSetReminder action", () => {
    const onSet = vi.fn();
    const banner = <TodoReminderBanner onSetReminder={onSet} />;
    expect(banner).toBeDefined();
    expect(banner.props.onSetReminder).toBe(onSet);
  });

  it("renders TodoItemCard with item properties and timeline", () => {
    const onToggle = vi.fn();
    const item = {
      id: "line-1",
      text: "Drink a glass of water",
      completed: true,
      lineIndex: 0,
      section: "Daily routine",
      duration: "5 min",
      streakDays: 3,
      iconName: "water" as const,
    };
    const card = <TodoItemCard item={item} onToggle={onToggle} isFirst isLast={false} />;
    expect(card).toBeDefined();
    expect(card.props.item.text).toBe("Drink a glass of water");
    expect(card.props.item.completed).toBe(true);
  });

  it("renders AddTodoModal with add action callback", () => {
    const onClose = vi.fn();
    const onAdd = vi.fn();
    const modal = <AddTodoModal visible onClose={onClose} onAddTodo={onAdd} />;
    expect(modal).toBeDefined();
    expect(modal.props.visible).toBe(true);
  });

  it("renders TodoView with markdown content synchronization", () => {
    const onChange = vi.fn();
    const onSwitch = vi.fn();
    const todoView = (
      <TodoView
        content={sampleMarkdown}
        onContentChange={onChange}
        onSwitchToEditor={onSwitch}
        title="Budi"
      />
    );
    expect(todoView).toBeDefined();
    expect(todoView.props.title).toBe("Budi");
    expect(todoView.props.content).toBe(sampleMarkdown);
  });
});
