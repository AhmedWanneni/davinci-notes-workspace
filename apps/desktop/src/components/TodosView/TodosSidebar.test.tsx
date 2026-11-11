// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TooltipProvider } from "@app/design-system";
import { TodosSidebar } from "./TodosSidebar";

describe("TodosSidebar", () => {
  const defaultProps = {
    projects: [
      {
        id: "todos/Design",
        name: "Design",
        folderPath: "todos/Design",
        notePath: "todos/Design/Admin Dashboard.md",
        notes: [
          {
            id: "todos/Design/Admin Dashboard.md",
            name: "Admin Dashboard",
            notePath: "todos/Design/Admin Dashboard.md",
            sections: [],
          },
        ],
        sections: [],
      },
    ],
    selectedProjectId: "todos/Design",
    selectedNotePath: "todos/Design/Admin Dashboard.md",
    totalTodosCount: 10,
    remindersCount: 4,
    overdueCount: 1,
    scheduledCount: 2,
    onSelectProject: vi.fn(),
    onSelectNote: vi.fn(),
    onSelectMotherboard: vi.fn(),
    onSelectReminders: vi.fn(),
    onSelectScheduled: vi.fn(),
    onCreateProject: vi.fn(),
    onToggleSidebar: vi.fn(),
  };

  it("renders header bar, top navigation, and projects", () => {
    render(
      <TooltipProvider>
        <TodosSidebar {...defaultProps} />
      </TooltipProvider>,
    );

    expect(screen.getByText("Todos")).toBeDefined();
    expect(screen.getByText("Motherboard")).toBeDefined();
    expect(screen.getByText("Reminders")).toBeDefined();
    expect(screen.getByText("Scheduled Messages")).toBeDefined();
    expect(screen.getByText("Projects")).toBeDefined();
    expect(screen.getByText("Design")).toBeDefined();
  });

  it("calls onToggleSidebar when collapse button is clicked", () => {
    const onToggleSidebar = vi.fn();
    render(
      <TooltipProvider>
        <TodosSidebar {...defaultProps} onToggleSidebar={onToggleSidebar} />
      </TooltipProvider>,
    );

    const collapseBtn = screen.getByRole("button", { name: "Collapse sidebar" });
    fireEvent.click(collapseBtn);
    expect(onToggleSidebar).toHaveBeenCalledTimes(1);
  });
});
