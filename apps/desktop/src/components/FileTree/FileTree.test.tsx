// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TooltipProvider } from "@app/design-system";
import { FileTree } from "./FileTree";

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

describe("FileTree", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
    });
  });

  it("renders toolbar, file list container, and vault switcher at bottom", () => {
    render(
      <TooltipProvider>
        <FileTree
          filePaths={["Note A.md"]}
          folderPaths={[]}
          activePath={null}
          dirtyPaths={new Set()}
          vaultName="vault-1"
          vaultPath="/Users/test/vault-1"
          onCreateNote={vi.fn()}
          onCreateFolder={vi.fn().mockResolvedValue(null)}
          onNoteClick={vi.fn()}
        />
      </TooltipProvider>,
    );

    expect(screen.getByRole("button", { name: /vault-1/i })).toBeDefined();
    expect(screen.getByTestId("vault-switcher")).toBeDefined();
    expect(screen.getByLabelText("New note")).toBeDefined();
    expect(screen.getByLabelText("New folder")).toBeDefined();
  });
});
