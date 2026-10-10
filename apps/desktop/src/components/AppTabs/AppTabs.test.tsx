// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AppTabs } from "./AppTabs";

vi.mock("@app/design-system", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ toggleMaximize: vi.fn() }),
}));

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
});
