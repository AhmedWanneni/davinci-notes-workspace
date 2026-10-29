// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import { GraphView } from "./GraphView";
import type { GraphIndex } from "@app/indexer";

const mockGraph: GraphIndex = {
  nodes: new Map([
    ["note-1.md", { id: "note-1.md", label: "Start Here" }],
    ["note-2.md", { id: "note-2.md", label: "tasks-default.base" }],
    ["note-3.md", { id: "note-3.md", label: "calendar-default.base" }],
  ]),
  edges: [
    { source: "note-1.md", target: "note-2.md" },
    { source: "note-1.md", target: "note-3.md" },
  ],
  backlinks: new Map(),
};

describe("GraphView", () => {
  it("renders empty state in global mode when graph has no nodes", () => {
    const emptyGraph: GraphIndex = {
      nodes: new Map(),
      edges: [],
      backlinks: new Map(),
    };

    render(<GraphView graph={emptyGraph} defaultMode="global" />);
    expect(screen.getByText("Empty Graph")).toBeDefined();
    expect(
      screen.getByText("No notes found in this vault."),
    ).toBeDefined();
  });

  it("renders empty state in local mode when there are no connections", () => {
    const singleNodeGraph: GraphIndex = {
      nodes: new Map([["lonely.md", { id: "lonely.md", label: "Lonely" }]]),
      edges: [],
      backlinks: new Map(),
    };

    render(<GraphView graph={singleNodeGraph} defaultMode="local" />);
    expect(screen.getByText("No Connections")).toBeDefined();
  });

  it("renders nodes, labels, and edges when graph data exists", () => {
    const { container } = render(
      <GraphView graph={mockGraph} defaultMode="global" />,
    );

    const labels = container.querySelectorAll(".graph-view__label");
    expect(labels.length).toBe(3);
    const labelTexts = Array.from(labels).map((l) => l.textContent);
    expect(labelTexts).toContain("Start Here");
    expect(labelTexts).toContain("tasks-default.base");
    expect(labelTexts).toContain("calendar-default.base");

    const nodes = container.querySelectorAll(".graph-view__node");
    expect(nodes.length).toBe(3);

    const edges = container.querySelectorAll(".graph-view__edge");
    expect(edges.length).toBe(2);
  });

  it("calls onNavigate when a node group is clicked", () => {
    const onNavigate = vi.fn();
    const { container } = render(
      <GraphView
        graph={mockGraph}
        defaultMode="global"
        onNavigate={onNavigate}
      />,
    );

    const firstNodeGroup = container.querySelector(".graph-view__node-group");
    expect(firstNodeGroup).not.toBeNull();
    fireEvent.click(firstNodeGroup!);

    expect(onNavigate).toHaveBeenCalledWith("note-1.md");
  });

  it("renders zoom controls and allows toggling mode", () => {
    render(<GraphView graph={mockGraph} defaultMode="global" />);

    expect(screen.getByLabelText("Zoom in")).toBeDefined();
    expect(screen.getByLabelText("Zoom out")).toBeDefined();
    expect(screen.getByLabelText("Reset zoom")).toBeDefined();
    expect(screen.getByLabelText("Switch to Local Graph")).toBeDefined();

    fireEvent.click(screen.getByLabelText("Switch to Local Graph"));
    expect(screen.getByLabelText("Switch to Global Graph")).toBeDefined();
  });
});
