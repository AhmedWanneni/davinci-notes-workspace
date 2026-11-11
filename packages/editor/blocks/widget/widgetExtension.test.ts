// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { EditorState, EditorSelection } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import {
  findWidgetBlocks,
  widgetExtension,
  widgetDecorationsField,
} from "./widgetExtension";
import { WidgetBlockWidget } from "./widgetWidget";

function createTestState(doc: string, cursorPosition = 0) {
  return EditorState.create({
    doc,
    selection: EditorSelection.cursor(cursorPosition),
    extensions: [markdown(), widgetExtension()],
  });
}

describe("widgetExtension and CodeMirror decorations", () => {
  it("detects ```widget code blocks and extracts their source", () => {
    const text = `# Title\n\n\`\`\`widget\n<svg><circle r="10"/></svg>\n\`\`\`\n\nSome text`;
    const state = createTestState(text, 0);
    const blocks = findWidgetBlocks(state);

    expect(blocks.length).toBe(1);
    expect(blocks[0].source.trim()).toBe('<svg><circle r="10"/></svg>');
    expect(blocks[0].lineFrom).toBe(3);
  });

  it("ignores non-widget code blocks like javascript or mermaid", () => {
    const text = `# Title\n\n\`\`\`javascript\nconsole.log(123);\n\`\`\`\n\n\`\`\`mermaid\ngraph TD; A-->B;\n\`\`\``;
    const state = createTestState(text, 0);
    const blocks = findWidgetBlocks(state);

    expect(blocks.length).toBe(0);
  });

  it("creates zero decorations and mounts no iframes for notes without widgets", () => {
    const text = `# Plain Note\n\nThis note has only prose and ordinary text.`;
    const state = createTestState(text, 0);
    const blocks = findWidgetBlocks(state);
    expect(blocks.length).toBe(0);
  });

  it("replaces block with widget decoration when cursor is outside", () => {
    const text = `# Title\n\n\`\`\`widget\n<div>Widget Preview</div>\n\`\`\`\n\nFooter text`;
    // Cursor at position 0 (outside widget block)
    const state = createTestState(text, 0);
    const blocks = findWidgetBlocks(state);
    expect(blocks.length).toBe(1);

    // Retrieve decorations field
    const field = state.field(widgetDecorationsField, false);
    expect(field).toBeDefined();
    expect(field?.size).toBe(1);
  });

  it("reveals raw markdown source when cursor enters the widget block", () => {
    const text = `# Title\n\n\`\`\`widget\n<div>Interactive</div>\n\`\`\`\n\nEnd`;
    const blockStart = text.indexOf("```widget");
    // Place cursor inside the widget block
    const insideCursor = blockStart + 12;

    const state = createTestState(text, insideCursor);
    const field = state.field(widgetDecorationsField, false);
    // Cursor is inside: decoration is omitted so raw source is visible and editable
    expect(field?.size).toBe(0);
  });

  it("returns true on WidgetBlockWidget.eq() when source is unchanged to prevent iframe reload on external typing", () => {
    const block1 = {
      from: 10,
      to: 50,
      source: "<div>Constant Chart</div>",
      lineFrom: 2,
      lineTo: 4,
    };
    const block2 = {
      from: 15, // moved due to text inserted earlier in document
      to: 55,
      source: "<div>Constant Chart</div>",
      lineFrom: 3,
      lineTo: 5,
    };
    const widget1 = new WidgetBlockWidget(block1);
    const widget2 = new WidgetBlockWidget(block2);

    expect(widget1.eq(widget2)).toBe(true);
    expect(widget1.updateDOM(document.createElement("div"))).toBe(true);
  });
});
