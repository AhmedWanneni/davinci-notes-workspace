import { renderHook, act } from "@testing-library/react";
import type { Connection, Edge, Node } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import { useCanvasEdgeInteractions } from "./useCanvasEdgeInteractions";
import { useCanvasNodeChanges } from "./useCanvasNodeChanges";

describe("useCanvasEdgeInteractions & cascade deletion", () => {
  it("creates a new edge onConnect and persists", () => {
    let nodesState: Node[] = [
      { id: "n1", type: "text", position: { x: 0, y: 0 }, data: {} },
      { id: "n2", type: "text", position: { x: 200, y: 0 }, data: {} },
    ];
    let edgesState: Edge[] = [];
    const edgesRef = { current: edgesState };
    const persistCanvas = vi.fn();
    const setContextMenu = vi.fn();

    const setNodes = (action: React.SetStateAction<Node[]>) => {
      nodesState = typeof action === "function" ? action(nodesState) : action;
    };
    const setEdges = (action: React.SetStateAction<Edge[]>) => {
      edgesState = typeof action === "function" ? action(edgesState) : action;
      edgesRef.current = edgesState;
    };

    const { result } = renderHook(() =>
      useCanvasEdgeInteractions({
        setNodes,
        setEdges,
        edgesRef,
        persistCanvas,
        setContextMenu,
      }),
    );

    const connection: Connection = {
      source: "n1",
      sourceHandle: "right",
      target: "n2",
      targetHandle: "left",
    };

    act(() => {
      result.current.onConnect(connection);
    });

    expect(edgesState).toHaveLength(1);
    expect(edgesState[0].source).toBe("n1");
    expect(edgesState[0].sourceHandle).toBe("right");
    expect(edgesState[0].target).toBe("n2");
    expect(edgesState[0].targetHandle).toBe("left");
  });

  it("updates edge label and persists", () => {
    let nodesState: Node[] = [];
    let edgesState: Edge[] = [
      { id: "e1", source: "n1", target: "n2", data: {} },
    ];
    const edgesRef = { current: edgesState };
    const persistCanvas = vi.fn();
    const setContextMenu = vi.fn();

    const setNodes = (action: React.SetStateAction<Node[]>) => {
      nodesState = typeof action === "function" ? action(nodesState) : action;
    };
    const setEdges = (action: React.SetStateAction<Edge[]>) => {
      edgesState = typeof action === "function" ? action(edgesState) : action;
      edgesRef.current = edgesState;
    };

    const { result } = renderHook(() =>
      useCanvasEdgeInteractions({
        setNodes,
        setEdges,
        edgesRef,
        persistCanvas,
        setContextMenu,
      }),
    );

    act(() => {
      result.current.onEdgeLabelChange("e1", "New label");
    });

    expect(edgesState[0].label).toBe("New label");
    expect((edgesState[0].data as Record<string, unknown>).label).toBe(
      "New label",
    );
  });

  it("updates edge color and persists", () => {
    let nodesState: Node[] = [];
    let edgesState: Edge[] = [
      { id: "e1", source: "n1", target: "n2", data: { toEnd: "arrow" } },
    ];
    const edgesRef = { current: edgesState };
    const persistCanvas = vi.fn();
    const setContextMenu = vi.fn();

    const setNodes = (action: React.SetStateAction<Node[]>) => {
      nodesState = typeof action === "function" ? action(nodesState) : action;
    };
    const setEdges = (action: React.SetStateAction<Edge[]>) => {
      edgesState = typeof action === "function" ? action(edgesState) : action;
      edgesRef.current = edgesState;
    };

    const { result } = renderHook(() =>
      useCanvasEdgeInteractions({
        setNodes,
        setEdges,
        edgesRef,
        persistCanvas,
        setContextMenu,
      }),
    );

    act(() => {
      result.current.onEdgeColorChange("e1", "4");
    });

    expect((edgesState[0].data as Record<string, unknown>).color).toBe("4");
    expect(edgesState[0].markerEnd?.color).toBe(
      "var(--color-text-success, #2ecc71)",
    );
  });

  it("deletes edge and removes from state", () => {
    let nodesState: Node[] = [];
    let edgesState: Edge[] = [
      { id: "e1", source: "n1", target: "n2", data: {} },
    ];
    const edgesRef = { current: edgesState };
    const persistCanvas = vi.fn();
    const setContextMenu = vi.fn();

    const setNodes = (action: React.SetStateAction<Node[]>) => {
      nodesState = typeof action === "function" ? action(nodesState) : action;
    };
    const setEdges = (action: React.SetStateAction<Edge[]>) => {
      edgesState = typeof action === "function" ? action(edgesState) : action;
      edgesRef.current = edgesState;
    };

    const { result } = renderHook(() =>
      useCanvasEdgeInteractions({
        setNodes,
        setEdges,
        edgesRef,
        persistCanvas,
        setContextMenu,
      }),
    );

    act(() => {
      result.current.deleteEdge("e1");
    });

    expect(edgesState).toHaveLength(0);
  });

  it("cascade-deletes connected edges when a node is deleted", () => {
    let nodesState: Node[] = [
      { id: "n1", type: "text", position: { x: 0, y: 0 }, data: {} },
      { id: "n2", type: "text", position: { x: 200, y: 0 }, data: {} },
      { id: "n3", type: "text", position: { x: 400, y: 0 }, data: {} },
    ];
    let edgesState: Edge[] = [
      { id: "e1", source: "n1", target: "n2", data: {} },
      { id: "e2", source: "n2", target: "n3", data: {} },
      { id: "e3", source: "n1", target: "n3", data: {} },
    ];
    const edgesRef = { current: edgesState };
    const persistCanvas = vi.fn();

    const setNodes = (action: React.SetStateAction<Node[]>) => {
      nodesState = typeof action === "function" ? action(nodesState) : action;
    };
    const setEdges = (action: React.SetStateAction<Edge[]>) => {
      edgesState = typeof action === "function" ? action(edgesState) : action;
      edgesRef.current = edgesState;
    };

    const { result } = renderHook(() =>
      useCanvasNodeChanges({
        setNodes,
        setEdges,
        edgesRef,
        persistCanvas,
      }),
    );

    // Delete node "n2"
    act(() => {
      result.current.deleteNode("n2");
    });

    expect(nodesState.map((n) => n.id)).toEqual(["n1", "n3"]);
    // Edges e1 (n1->n2) and e2 (n2->n3) should be deleted, leaving only e3 (n1->n3)
    expect(edgesState.map((e) => e.id)).toEqual(["e3"]);
  });
});
