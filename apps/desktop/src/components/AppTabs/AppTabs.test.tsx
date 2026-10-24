// @vitest-environment jsdom
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { AppTabs } from "./AppTabs";

vi.mock("@app/design-system", async () => {
  const actual =
    await vi.importActual<Record<string, unknown>>("@app/design-system");
  return {
    ...actual,
    Tooltip: ({ children }: { children: ReactNode }) => children,
  };
});

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ toggleMaximize: vi.fn() }),
}));

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.setPointerCapture = () => {};
  window.HTMLElement.prototype.releasePointerCapture = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
});

describe("AppTabs", () => {
  it("creates a new note from the plus button", () => {
    const onCreateNote = vi.fn();

    render(
      <AppTabs
        openNotes={[]}
        activeNotePath={null}
        dirtyNotes={new Set()}
        onSelectNote={vi.fn()}
        onCloseNote={vi.fn()}
        onCreateNote={onCreateNote}
        isMac={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create new note" }));

    expect(onCreateNote).toHaveBeenCalledOnce();
    expect(onCreateNote).toHaveBeenCalledWith();
  });

  it("renders conflict dot indicator when note has a conflict", () => {
    const conflictNotes = new Map([["notes/a.md", "# External change"]]);

    const { container } = render(
      <AppTabs
        openNotes={["notes/a.md"]}
        activeNotePath="notes/a.md"
        dirtyNotes={new Set(["notes/a.md"])}
        conflictNotes={conflictNotes}
        onSelectNote={vi.fn()}
        onCloseNote={vi.fn()}
        isMac={false}
      />,
    );

    expect(container.querySelector(".app-tabs__conflict-dot")).toBeTruthy();
    expect(container.querySelector(".app-tabs__dirty-dot")).toBeFalsy();
  });

  it("opens dropdown and lists open tabs with active indicator and Close all action", async () => {
    const onSelectNote = vi.fn();
    const onCloseAllNotes = vi.fn();
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(
      <AppTabs
        openNotes={["notes/first.md", "notes/second.md", "canvas/board.canvas"]}
        activeNotePath="notes/second.md"
        dirtyNotes={new Set()}
        onSelectNote={onSelectNote}
        onCloseNote={vi.fn()}
        onCloseAllNotes={onCloseAllNotes}
        isMac={false}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Open tabs list" });
    expect(trigger).toBeDefined();
    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole("menu")).toBeDefined();
    });

    const menu = screen.getByRole("menu");
    const menuFirst = within(menu).getByText("first");
    const menuSecond = within(menu).getByText("second");
    const menuBoard = within(menu).getByText("board");
    expect(menuFirst).toBeDefined();
    expect(menuSecond).toBeDefined();
    expect(menuBoard).toBeDefined();

    const secondItem = menuSecond.closest('[role="menuitem"]');
    expect(secondItem?.getAttribute("data-active")).toBe("true");

    fireEvent.click(menuFirst);
    expect(onSelectNote).toHaveBeenCalledWith("notes/first.md");
    expect(scrollIntoViewMock).toHaveBeenCalled();

    fireEvent.pointerDown(trigger);
    fireEvent.click(trigger);
    await waitFor(() => {
      expect(screen.getByText("Close all")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Close all"));
    expect(onCloseAllNotes).toHaveBeenCalledOnce();
  });

  it("does not render dropdown icon when no tabs are open", () => {
    render(
      <AppTabs
        openNotes={[]}
        activeNotePath={null}
        dirtyNotes={new Set()}
        onSelectNote={vi.fn()}
        onCloseNote={vi.fn()}
        isMac={false}
      />,
    );

    expect(screen.queryByRole("button", { name: "Open tabs list" })).toBeNull();
  });

  it("renders distinct kanban icon for board tabs", () => {
    const { container } = render(
      <AppTabs
        openNotes={["board.md", "regular.md"]}
        activeNotePath="board.md"
        dirtyNotes={new Set()}
        boardNotes={new Set(["board.md"])}
        onSelectNote={vi.fn()}
        onCloseNote={vi.fn()}
        isMac={false}
      />,
    );

    const tabs = container.querySelectorAll(".app-tabs__tab");
    expect(tabs).toHaveLength(2);
    // Tab 1 is board, tab 2 is markdown
    expect(tabs[0].querySelector("svg")).toBeDefined();
    expect(tabs[1].querySelector("svg")).toBeDefined();
  });
});
