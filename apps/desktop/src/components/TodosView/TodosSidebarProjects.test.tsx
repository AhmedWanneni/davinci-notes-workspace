// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodosSidebarProjects } from "./TodosSidebarProjects";

describe("TodosSidebarProjects", () => {
  it("renders projects list and handles project click", () => {
    const onSelectProject = vi.fn();
    render(
      <TodosSidebarProjects
        projects={[
          {
            id: "todos/Engineering",
            name: "Engineering",
            folderPath: "todos/Engineering",
            notePath: "todos/Engineering/Sprint.md",
            notes: [],
            sections: [],
          },
        ]}
        selectedProjectId=""
        viewMode="project"
        onSelectProject={onSelectProject}
        onCreateProject={vi.fn()}
      />,
    );

    expect(screen.getByText("Engineering")).toBeDefined();
    fireEvent.click(screen.getByText("Engineering"));
    expect(onSelectProject).toHaveBeenCalledWith("todos/Engineering");
  });
});
