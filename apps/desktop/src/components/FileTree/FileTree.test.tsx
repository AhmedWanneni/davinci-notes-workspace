// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TooltipProvider } from "@app/design-system";
import { FileTree } from "./FileTree";
import { FileTreeRow } from "./FileTreeRow";
import { FileTreeContextMenu } from "./FileTreeContextMenu";
import { filterGraphByFolder } from "../GlobalGraphLeaf/GlobalGraphLeaf";
import type { GraphIndex } from "@app/indexer";

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

  it("renders vertical ... folder action button and opens folder menu with Show folder graph", () => {
    const onContextMenu = vi.fn();
    const onOpenFolderGraph = vi.fn();

    render(
      <div>
        <FileTreeRow
          item={{
            node: {
              name: "Learning",
              path: "Learning",
              type: "folder",
              children: [],
            },
            depth: 0,
          }}
          top={0}
          height={28}
          isActive={false}
          isDirty={false}
          isExpanded={false}
          isRenaming={false}
          draftStem=""
          onDraftStemChange={vi.fn()}
          onCommitRename={vi.fn()}
          onCancelRename={vi.fn()}
          onClick={vi.fn()}
          onContextMenu={onContextMenu}
          onDoubleClick={vi.fn()}
        />
        <FileTreeContextMenu
          x={100}
          y={100}
          targetType="folder"
          targetPath="Learning"
          onNewNote={vi.fn()}
          onNewFolder={vi.fn()}
          onOpenFolderGraph={onOpenFolderGraph}
          onClose={vi.fn()}
        />
      </div>,
    );

    const moreBtn = screen.getByRole("button", {
      name: "Folder actions for Learning",
    });
    expect(moreBtn).toBeDefined();
    fireEvent.click(moreBtn);
    expect(onContextMenu).toHaveBeenCalledOnce();

    const graphBtn = screen.getByRole("menuitem", {
      name: /show folder graph/i,
    });
    fireEvent.click(graphBtn);
    expect(onOpenFolderGraph).toHaveBeenCalledWith("Learning");
  });

  it("filters graph to only files inside the selected folder", () => {
    const fullGraph: GraphIndex = {
      nodes: new Map([
        ["Learning/English.md", { id: "Learning/English.md", label: "English" }],
        ["Learning/Books.md", { id: "Learning/Books.md", label: "Books" }],
        ["Movies/Inception.md", { id: "Movies/Inception.md", label: "Inception" }],
      ]),
      edges: [
        { source: "Learning/English.md", target: "Learning/Books.md" },
        { source: "Learning/English.md", target: "Movies/Inception.md" },
      ],
      backlinks: new Map([
        ["Learning/Books.md", ["Learning/English.md"]],
        ["Movies/Inception.md", ["Learning/English.md"]],
      ]),
    };

    const filtered = filterGraphByFolder(fullGraph, "Learning", [
      "Learning/English.md",
      "Learning/Books.md",
      "Learning/Sub/Grammar.md",
      "Movies/Inception.md",
    ]);

    expect(Array.from(filtered.nodes.keys()).sort()).toEqual([
      "Learning/Books.md",
      "Learning/English.md",
      "Learning/Sub/Grammar.md",
    ]);
    expect(filtered.edges).toEqual([
      { source: "Learning/English.md", target: "Learning/Books.md" },
    ]);
  });
});
