import { describe, expect, it } from "vitest";
import { performance } from "node:perf_hooks";
import { parseCanvas } from "./parseCanvas";
import { serializeCanvas } from "./serializeCanvas";
import {
  jsonCanvasToReactFlow,
  reactFlowToJsonCanvas,
} from "./canvasTranslation";
import { generateLargeCanvas } from "./fixtures/generateLargeCanvas";
import { snapNodeToAlignment } from "./snapNodeAlignment";
import { reparentNodesOnDrop } from "./groupContainment";

describe("Canvas Performance Benchmark", () => {
  const largeCanvasData = generateLargeCanvas({
    numTextNodes: 50,
    numFileNodes: 30,
    numImageNodes: 20,
    numVideoNodes: 10,
    numGroupNodes: 10,
    numEdges: 130,
  });
  const largeCanvasJson = serializeCanvas(largeCanvasData);

  const emptyCanvasJson = '{\n  "nodes": [],\n  "edges": []\n}';
  const emptyCanvasData = parseCanvas(emptyCanvasJson);

  it("measures parse and ReactFlow state hydration latency", () => {
    // Warmup
    for (let i = 0; i < 5; i++) {
      jsonCanvasToReactFlow(parseCanvas(largeCanvasJson));
    }

    // Benchmark Empty Canvas
    const emptyStart = performance.now();
    for (let i = 0; i < 100; i++) {
      jsonCanvasToReactFlow(parseCanvas(emptyCanvasJson));
    }
    const emptyAvgMs = (performance.now() - emptyStart) / 100;

    // Benchmark Large Canvas (120 nodes, 130 edges)
    const largeStart = performance.now();
    const ITERATIONS = 100;
    for (let i = 0; i < ITERATIONS; i++) {
      const parsed = parseCanvas(largeCanvasJson);
      jsonCanvasToReactFlow(parsed);
    }
    const largeAvgMs = (performance.now() - largeStart) / ITERATIONS;

    console.log(`\n=== CANVAS LOAD & HYDRATION BENCHMARK ===`);
    console.log(`Empty Canvas Load: ${emptyAvgMs.toFixed(4)} ms`);
    console.log(`Large Canvas (120 nodes, 130 edges) Load: ${largeAvgMs.toFixed(4)} ms`);
    console.log(`Load Delta: +${(largeAvgMs - emptyAvgMs).toFixed(4)} ms`);
    console.log(`=========================================\n`);

    expect(largeAvgMs).toBeLessThan(25); // Target < 25ms for 120 nodes
  });

  it("measures serialization and translation latency", () => {
    const rfLarge = jsonCanvasToReactFlow(largeCanvasData);
    const rfEmpty = jsonCanvasToReactFlow(emptyCanvasData);

    // Warmup
    for (let i = 0; i < 5; i++) {
      serializeCanvas(reactFlowToJsonCanvas(rfLarge.nodes, rfLarge.edges));
    }

    // Benchmark Empty Canvas Serialization
    const emptyStart = performance.now();
    for (let i = 0; i < 100; i++) {
      serializeCanvas(reactFlowToJsonCanvas(rfEmpty.nodes, rfEmpty.edges));
    }
    const emptyAvgMs = (performance.now() - emptyStart) / 100;

    // Benchmark Large Canvas Serialization (120 nodes, 130 edges)
    const largeStart = performance.now();
    const ITERATIONS = 100;
    for (let i = 0; i < ITERATIONS; i++) {
      const data = reactFlowToJsonCanvas(rfLarge.nodes, rfLarge.edges);
      serializeCanvas(data);
    }
    const largeAvgMs = (performance.now() - largeStart) / ITERATIONS;

    console.log(`\n=== CANVAS SERIALIZATION BENCHMARK ===`);
    console.log(`Empty Canvas Save: ${emptyAvgMs.toFixed(4)} ms`);
    console.log(`Large Canvas (120 nodes, 130 edges) Save: ${largeAvgMs.toFixed(4)} ms`);
    console.log(`Save Delta: +${(largeAvgMs - emptyAvgMs).toFixed(4)} ms`);
    console.log(`======================================\n`);

    expect(largeAvgMs).toBeLessThan(25); // Target < 25ms
  });

  it("measures alignment guide computation latency per drag frame", () => {
    const rfLarge = jsonCanvasToReactFlow(largeCanvasData);
    const draggedNode = rfLarge.nodes[15];
    const otherNodes = rfLarge.nodes.filter((n) => n.id !== draggedNode.id);

    // Warmup
    for (let i = 0; i < 10; i++) {
      snapNodeToAlignment(draggedNode, otherNodes);
    }

    const start = performance.now();
    const ITERATIONS = 500;
    for (let i = 0; i < ITERATIONS; i++) {
      snapNodeToAlignment(
        {
          ...draggedNode,
          position: {
            x: draggedNode.position.x + (i % 10),
            y: draggedNode.position.y + (i % 10),
          },
        },
        otherNodes,
      );
    }
    const avgMs = (performance.now() - start) / ITERATIONS;

    console.log(`\n=== DRAG ALIGNMENT LATENCY BENCHMARK ===`);
    console.log(`Alignment check per frame (120 nodes): ${avgMs.toFixed(4)} ms`);
    console.log(`16.6ms frame budget consumption: ${((avgMs / 16.66) * 100).toFixed(2)}%`);
    console.log(`========================================\n`);

    expect(avgMs).toBeLessThan(2.0); // Far below 16.6ms 60fps threshold
  });

  it("measures reparenting & group containment compute latency on drop", () => {
    const rfLarge = jsonCanvasToReactFlow(largeCanvasData);
    const multiSelectedIds = rfLarge.nodes.slice(10, 30).map((n) => n.id);

    // Warmup
    for (let i = 0; i < 5; i++) {
      reparentNodesOnDrop(rfLarge.nodes, multiSelectedIds);
    }

    const start = performance.now();
    const ITERATIONS = 100;
    for (let i = 0; i < ITERATIONS; i++) {
      reparentNodesOnDrop(rfLarge.nodes, multiSelectedIds);
    }
    const avgMs = (performance.now() - start) / ITERATIONS;

    console.log(`\n=== DROP REPARENTING LATENCY BENCHMARK ===`);
    console.log(`Reparenting 20 dragged nodes in 120 nodes: ${avgMs.toFixed(4)} ms`);
    console.log(`==========================================\n`);

    expect(avgMs).toBeLessThan(10);
  });
});
