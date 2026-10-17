// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@app/design-system";
import { IconRail } from "./IconRail";

function renderIconRail(props: Partial<Parameters<typeof IconRail>[0]> = {}) {
  const defaults = {
    isLeftSidebarOpen: false,
    onToggleLeftSidebar: vi.fn(),
    onOpenSearch: vi.fn(),
    onOpenGlobalGraph: vi.fn(),
    onOpenSettings: vi.fn(),
    onCloseVault: vi.fn(),
    isGlobalGraphOpen: false,
  };
  return render(
    <TooltipProvider>
      <IconRail {...defaults} {...props} />
    </TooltipProvider>,
  );
}

describe("IconRail", () => {
  it("renders navigation buttons and triggers onOpenGlobalGraph", () => {
    const onOpenGlobalGraph = vi.fn();
    renderIconRail({ onOpenGlobalGraph });

    const graphBtn = screen.getByLabelText("Graph view");
    expect(graphBtn).toBeDefined();
    expect(graphBtn.getAttribute("data-active")).toBeNull();

    fireEvent.click(graphBtn);
    expect(onOpenGlobalGraph).toHaveBeenCalledOnce();
  });

  it("marks graph button as active when isGlobalGraphOpen is true", () => {
    renderIconRail({ isGlobalGraphOpen: true });

    const graphBtn = screen.getByLabelText("Graph view");
    expect(graphBtn.getAttribute("data-active")).toBe("true");
  });

  it("triggers sidebar toggle and search handlers", () => {
    const onToggleLeftSidebar = vi.fn();
    const onOpenSearch = vi.fn();
    renderIconRail({
      isLeftSidebarOpen: true,
      onToggleLeftSidebar,
      onOpenSearch,
    });

    const filesBtn = screen.getByLabelText("Files");
    expect(filesBtn.getAttribute("data-active")).toBe("true");

    fireEvent.click(filesBtn);
    expect(onToggleLeftSidebar).toHaveBeenCalledOnce();

    const searchBtn = screen.getByLabelText("Search");
    fireEvent.click(searchBtn);
    expect(onOpenSearch).toHaveBeenCalledOnce();
  });

  it("renders reminders button and triggers onOpenReminders", () => {
    const onOpenReminders = vi.fn();
    renderIconRail({ onOpenReminders });

    const remindersBtn = screen.getByLabelText("Reminders");
    expect(remindersBtn).toBeDefined();

    fireEvent.click(remindersBtn);
    expect(onOpenReminders).toHaveBeenCalledOnce();
  });
});
