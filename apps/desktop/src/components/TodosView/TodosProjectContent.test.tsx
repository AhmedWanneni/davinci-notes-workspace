// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TodosProjectContent } from "./TodosProjectContent";

describe("TodosProjectContent", () => {
  it("renders sections and tasks", () => {
    render(
      <TodosProjectContent
        activeProject={null}
        filteredSections={[
          {
            name: "Urgent",
            todos: [
              {
                id: "1",
                text: "Ship beta release",
                completed: false,
                notePath: "todos/Launch.md",
                lineIndex: 1,
                section: "Urgent",
              },
            ],
          },
        ]}
        searchQuery=""
        allNotePaths={[]}
        currentNotePath="todos/Launch.md"
        onToggleTodo={vi.fn()}
        onUpdateText={vi.fn()}
        onAddLink={vi.fn()}
        onAddReminder={vi.fn()}
        onEnterFocus={vi.fn()}
        onAddTodoToSection={vi.fn().mockResolvedValue(undefined)}
        onCreateTodoNote={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText("Urgent")).toBeDefined();
    expect(screen.getByText("Ship beta release")).toBeDefined();
  });

  it("shows empty state when no tasks match", () => {
    render(
      <TodosProjectContent
        activeProject={{
          id: "p-1",
          name: "Mobile",
          folderPath: "todos/Mobile",
          notePath: "",
          notes: [],
          sections: [],
        }}
        filteredSections={[]}
        searchQuery=""
        allNotePaths={[]}
        currentNotePath=""
        onToggleTodo={vi.fn()}
        onUpdateText={vi.fn()}
        onAddLink={vi.fn()}
        onAddReminder={vi.fn()}
        onEnterFocus={vi.fn()}
        onAddTodoToSection={vi.fn().mockResolvedValue(undefined)}
        onCreateTodoNote={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText('Project "Mobile" is empty')).toBeDefined();
    expect(screen.getByText("+ Add first todo note")).toBeDefined();
  });
});
