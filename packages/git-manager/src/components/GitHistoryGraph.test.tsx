import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { GitHistoryGraph } from "./GitHistoryGraph";
import type { GitGraphNode } from "../types/gitTypes";

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: (options: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: options.count }, (_, index) => ({
        index,
        start: index * 28,
        size: 28,
        key: index,
      })),
    getTotalSize: () => options.count * 28,
  }),
}));

describe("GitHistoryGraph", () => {
  const mockNodes: GitGraphNode[] = [
    {
      commit: {
        hash: "1234567890abcdef",
        parents: ["fedcba0987654321"],
        authorName: "Alice",
        authorDate: 1729001000,
        subject: "feat: first commit",
        refs: "HEAD -> main",
      },
      lane: 0,
      connections: [{ fromLane: 0, toLane: 0 }],
    },
    {
      commit: {
        hash: "fedcba0987654321",
        parents: [],
        authorName: "Bob",
        authorDate: 1729000000,
        subject: "chore: init repo",
        refs: "",
      },
      lane: 0,
      connections: [],
    },
  ];

  it("renders commit history header and commit items", () => {
    render(<GitHistoryGraph nodes={mockNodes} />);

    expect(screen.getByText("Commit History (2)")).toBeDefined();
    expect(screen.getByText("feat: first commit")).toBeDefined();
    expect(screen.getByText("chore: init repo")).toBeDefined();
    expect(screen.getByText("[HEAD -> main]")).toBeDefined();
    expect(screen.getByText("1234567")).toBeDefined();
  });

  it("triggers onSelectCommit when a row is clicked", () => {
    const handleSelect = vi.fn();
    render(
      <GitHistoryGraph nodes={mockNodes} onSelectCommit={handleSelect} />
    );

    const row = screen.getByTestId("git-commit-row-1234567");
    fireEvent.click(row);
    expect(handleSelect).toHaveBeenCalledWith(mockNodes[0]);
  });
});
