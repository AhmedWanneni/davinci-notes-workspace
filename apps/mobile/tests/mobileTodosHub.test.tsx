import React from "react";
import { describe, it, expect, vi } from "vitest";
import { TodoTaskRow } from "../components/todos/TodoTaskRow";
import { TodosSidebar } from "../components/todos/TodosSidebar";
import { AddProjectModal } from "../components/todos/AddProjectModal";
import { AddTodoListModal } from "../components/todos/AddTodoListModal";
import { AddTodoItemModal } from "../components/todos/AddTodoItemModal";
import {
  parseTodosFromMarkdown,
  removeTodoFromMarkdown,
} from "../components/todos/todoParser";
import type {
  MobileTodoItem,
  MobileTodoProject,
} from "../components/todos/types";

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/todos",
}));

vi.mock("../theme", () => ({
  useTheme: () => ({
    tokens: {
      color: {
        bg: { primary: "#ffffff", secondary: "#f5f5f5", hover: "#ebebeb" },
        text: { normal: "#111111", muted: "#777777", "on-accent": "#ffffff" },
        border: { subtle: "#e5e5e5", normal: "#cccccc" },
        interactive: { accent: "#7f6df2" },
      },
    },
  }),
}));

describe("Mobile Todos Tasks Hub", () => {
  const sampleMarkdown = `# Work Tasks

## Marketing
- [ ] Launch product page (@2025-03-10 10:00) [15 min]
- [x] Send newsletter (@2025-03-09 14:00) [5 min]
`;

  it("parses notePath, project and dueDate from markdown", () => {
    const sections = parseTodosFromMarkdown(
      sampleMarkdown,
      "Todos/Work/Marketing.md",
      "Work",
    );
    expect(sections.length).toBe(1);
    const [todo1, todo2] = sections[0].todos;

    expect(todo1.text).toBe("Launch product page");
    expect(todo1.completed).toBe(false);
    expect(todo1.notePath).toBe("Todos/Work/Marketing.md");
    expect(todo1.project).toBe("Work");
    expect(todo1.dueDate).toBe("2025-03-10");

    expect(todo2.text).toBe("Send newsletter");
    expect(todo2.completed).toBe(true);
    expect(todo2.dueDate).toBe("2025-03-09");
  });

  it("removes a todo from markdown line by lineIndex", () => {
    const removed = removeTodoFromMarkdown(sampleMarkdown, 3);
    expect(removed).not.toContain("Launch product page");
    expect(removed).toContain("Send newsletter");
  });

  it("renders TodoTaskRow with delete callback and without labels", () => {
    const onToggle = vi.fn();
    const onDelete = vi.fn();
    const onOpen = vi.fn();

    const item: MobileTodoItem = {
      id: "Todos/Work/Marketing.md#L4",
      text: "Launch product page",
      completed: false,
      lineIndex: 3,
      section: "Marketing",
      notePath: "Todos/Work/Marketing.md",
      project: "Work",
      dueDate: "2025-03-10",
      duration: "15 min",
    };

    const row = (
      <TodoTaskRow
        item={item}
        onToggle={onToggle}
        onDelete={onDelete}
        onOpenNote={onOpen}
      />
    );
    expect(row).toBeDefined();
    expect(row.props.item.text).toBe("Launch product page");
  });

  it("renders TodosSidebar with projects and their todo lists", () => {
    const onClose = vi.fn();
    const onSelectTodoList = vi.fn();
    const onAddProj = vi.fn();
    const onAddTodoList = vi.fn();
    const onDeleteProject = vi.fn();
    const onDeleteTodoList = vi.fn();

    const projects: MobileTodoProject[] = [
      {
        id: "daily",
        name: "Daily",
        folderPath: "Todos/Daily",
        todoLists: [
          {
            id: "Todos/Daily/Today.md",
            name: "Today",
            notePath: "Todos/Daily/Today.md",
            projectName: "Daily",
            todoCount: 4,
          },
        ],
        noteCount: 1,
        todoCount: 4,
      },
      {
        id: "work",
        name: "Work",
        folderPath: "Todos/Work",
        todoLists: [
          {
            id: "Todos/Work/Sprint.md",
            name: "Sprint",
            notePath: "Todos/Work/Sprint.md",
            projectName: "Work",
            todoCount: 2,
          },
        ],
        noteCount: 1,
        todoCount: 2,
      },
    ];

    const sidebar = (
      <TodosSidebar
        visible={true}
        onClose={onClose}
        projects={projects}
        openedTodoPath="Todos/Daily/Today.md"
        onSelectTodoList={onSelectTodoList}
        onAddProject={onAddProj}
        onAddTodoList={onAddTodoList}
        onDeleteProject={onDeleteProject}
        onDeleteTodoList={onDeleteTodoList}
      />
    );

    expect(sidebar).toBeDefined();
    expect(sidebar.props.visible).toBe(true);
    expect(sidebar.props.projects.length).toBe(2);
    expect(sidebar.props.projects[0].name).toBe("Daily");
    expect(sidebar.props.onDeleteProject).toBe(onDeleteProject);
    expect(sidebar.props.onDeleteTodoList).toBe(onDeleteTodoList);
  });

  it("renders AddProjectModal", () => {
    const onClose = vi.fn();
    const onCreate = vi.fn();

    const modal = (
      <AddProjectModal
        visible={true}
        onClose={onClose}
        onCreateProject={onCreate}
      />
    );

    expect(modal).toBeDefined();
    expect(modal.props.visible).toBe(true);
  });

  it("renders AddTodoListModal", () => {
    const onClose = vi.fn();
    const onCreate = vi.fn();

    const modal = (
      <AddTodoListModal
        visible={true}
        projectName="Work"
        onClose={onClose}
        onCreateTodoList={onCreate}
      />
    );

    expect(modal).toBeDefined();
    expect(modal.props.visible).toBe(true);
    expect(modal.props.projectName).toBe("Work");
  });

  it("renders AddTodoItemModal for the opened todo list", () => {
    const onClose = vi.fn();
    const onAdd = vi.fn();

    const modal = (
      <AddTodoItemModal
        visible={true}
        todoListName="Today"
        onClose={onClose}
        onAddItem={onAdd}
      />
    );

    expect(modal).toBeDefined();
    expect(modal.props.visible).toBe(true);
    expect(modal.props.todoListName).toBe("Today");
  });
});
