// @vitest-environment jsdom
import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import mermaid from "mermaid";
import { describe, expect, it } from "vitest";
import { findMermaidBlocks } from "../blocks/mermaid/mermaidExtension";
import {
  diagramItems,
  resolveSnippetPlaceholders,
} from "./diagrams";
import { findInsertItem, insertRegistry } from "./InsertRegistry";

describe("Diagram templates parser validation (Mermaid 11.16.1)", () => {
  mermaid.initialize({ startOnLoad: false });

  it("contains all 21 diagram items under the Diagrams group", () => {
    expect(diagramItems).toHaveLength(21);
    for (const item of diagramItems) {
      expect(item.group).toBe("Diagrams");
      expect(item.subgroup).toBeDefined();
    }
  });

  it.each(diagramItems.map((item) => [item.id, item]))(
    "template '%s' parses with mermaid 11.16.1 when placeholders are unchanged",
    async (_id, item) => {
      const built = item.build({ selectedText: "" });
      expect(built.block).toBe(true);

      const resolved = resolveSnippetPlaceholders(built.text);
      const match = /^```mermaid\n([\s\S]+?)\n```$/u.exec(resolved);
      expect(match).not.toBeNull();
      const code = match![1];

      // Parse with mermaid parser
      const parsed = await mermaid.parse(code);
      expect(parsed).toBeTruthy();
    },
  );

  it("detects each diagram as a valid Mermaid fenced block in CodeMirror", () => {
    for (const item of diagramItems) {
      const built = item.build({ selectedText: "" });
      const resolved = resolveSnippetPlaceholders(built.text);

      const state = EditorState.create({
        doc: `# Note Header\n\n${resolved}\n\nFooter text`,
        extensions: [markdown()],
      });

      const blocks = findMermaidBlocks(state);
      expect(blocks).toHaveLength(1);
      expect(blocks[0].source.trim()).not.toBe("");
    }
  });

  it("finds diagram items by common search terms", () => {
    const terms = [
      { query: "flow", expectedId: "diagram-flowchart" },
      { query: "uml", expectedId: "diagram-sequence" },
      { query: "chart", expectedId: "diagram-pie" },
      { query: "timeline", expectedId: "diagram-timeline" },
      { query: "cynefin", expectedId: "diagram-cynefin" },
      { query: "matrix", expectedId: "diagram-quadrant" },
      { query: "board", expectedId: "diagram-kanban" },
      { query: "network", expectedId: "diagram-packet" },
    ];

    for (const { query, expectedId } of terms) {
      const matches = insertRegistry.filter((item) =>
        [item.label, ...item.keywords].some((keyword) =>
          keyword.toLowerCase().includes(query.toLowerCase()),
        ),
      );
      expect(matches.some((item) => item.id === expectedId)).toBe(true);
    }
  });

  it("registers all diagram items in findInsertItem", () => {
    for (const item of diagramItems) {
      expect(findInsertItem(item.id)).toBe(item);
    }
  });
});
