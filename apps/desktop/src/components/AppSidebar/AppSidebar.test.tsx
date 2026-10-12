// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TooltipProvider } from "@app/design-system";
import { AppSidebar } from "./AppSidebar";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockImplementation((cmd: string) => {
    if (cmd === "get_recent_vaults") {
      return Promise.resolve([
        {
          path: "/Users/test/vault-1",
          name: "vault-1",
          lastOpenedAt: 1000,
          exists: true,
        },
      ]);
    }
    return Promise.resolve(null);
  }),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    toggleMaximize: vi.fn(),
  }),
}));

describe("AppSidebar", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
    });
  });

  it("renders header nav, file tree container, and vault switcher", () => {
    render(
      <TooltipProvider>
        <AppSidebar
          vaultName="vault-1"
          vaultPath="/Users/test/vault-1"
          allNotePaths={["Note A.md"]}
          allFolderPaths={[]}
          activeNotePath={null}
          dirtyNotes={new Set()}
          log={[]}
          isMac={true}
          onCreateNote={vi.fn()}
          onCreateFolder={vi.fn()}
          onNoteClick={vi.fn()}
        />
      </TooltipProvider>,
    );

    expect(screen.getByLabelText("File Explorer")).toBeDefined();
    expect(screen.getByLabelText("Files")).toBeDefined();
    expect(screen.getByLabelText("Search")).toBeDefined();
    expect(screen.getByLabelText("Bookmarks")).toBeDefined();
    expect(screen.getByRole("button", { name: /vault-1/i })).toBeDefined();
    expect(screen.getByLabelText("Settings")).toBeDefined();
    expect(screen.getByLabelText("Help")).toBeDefined();
  });

  it("handles collapsed state and shows/hides resizer", () => {
    const { rerender, container } = render(
      <TooltipProvider>
        <AppSidebar
          vaultName="vault-1"
          vaultPath="/Users/test/vault-1"
          allNotePaths={["Note A.md"]}
          allFolderPaths={[]}
          activeNotePath={null}
          dirtyNotes={new Set()}
          log={[]}
          isMac={true}
          isCollapsed={false}
          onCreateNote={vi.fn()}
          onCreateFolder={vi.fn()}
          onNoteClick={vi.fn()}
        />
      </TooltipProvider>,
    );

    const sidebar = container.querySelector(".app-sidebar");
    expect(sidebar?.getAttribute("data-collapsed")).toBeNull();
    expect(container.querySelector(".app-sidebar__resizer")).not.toBeNull();

    // Collapse sidebar
    rerender(
      <TooltipProvider>
        <AppSidebar
          vaultName="vault-1"
          vaultPath="/Users/test/vault-1"
          allNotePaths={["Note A.md"]}
          allFolderPaths={[]}
          activeNotePath={null}
          dirtyNotes={new Set()}
          log={[]}
          isMac={true}
          isCollapsed={true}
          onCreateNote={vi.fn()}
          onCreateFolder={vi.fn()}
          onNoteClick={vi.fn()}
        />
      </TooltipProvider>,
    );

    expect(sidebar?.getAttribute("data-collapsed")).toBe("true");
    expect(container.querySelector(".app-sidebar__resizer")).toBeNull();
  });
});

