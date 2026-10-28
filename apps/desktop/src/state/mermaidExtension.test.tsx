// @vitest-environment jsdom
import { editorTheme, mermaidExtension, mermaidTheme } from "@app/editor";
import { markdown } from "@codemirror/lang-markdown";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";

function createMermaidEditor(
  doc: string,
  readOnly = false,
  onLinkClick: (targetRaw: string) => void = () => {},
) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({
    state: EditorState.create({
      doc,
      extensions: [
        editorTheme,
        mermaidTheme,
        markdown(),
        ...(readOnly ? [EditorState.readOnly.of(true)] : []),
        mermaidExtension({ isReadOnly: readOnly, onLinkClick }),
      ],
    }),
    parent: container,
  });
  return { container, view, destroy: () => view.destroy() };
}

describe("Mermaid diagram extension", () => {
  const svgPrototype = SVGElement.prototype as SVGElement & {
    getBBox?: () => DOMRect;
  };

  if (!svgPrototype.getBBox) {
    svgPrototype.getBBox = () =>
      ({ height: 20, width: 100, x: 0, y: 0 }) as DOMRect;
  }

  it("renders flowcharts and sequence diagrams after leaving the source", async () => {
    const source = [
      "```mermaid",
      "graph TD",
      "A[Start] --> B[Finish]",
      "```",
      "",
      "```mermaid",
      "sequenceDiagram",
      "Alice->>Bob: Hello",
      "```",
    ].join("\n");
    const { container, view, destroy } = createMermaidEditor(source, true);

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(container.querySelectorAll(".cm-mermaid-diagram")).toHaveLength(2);
    expect(container.querySelectorAll("svg")).toHaveLength(2);
    destroy();
    view.destroy();
  });

  it("renders diagram without box, and provides hover hint to edit code", () => {
    const source = "```mermaid\ngraph LR\nA --> B\n```\n\nAfter";
    const { container, view, destroy } = createMermaidEditor(source);

    // Diagram is rendered without box and remains rendered when cursor moves
    view.dispatch({
      selection: EditorSelection.cursor(source.indexOf("A -->")),
    });
    const diagram = container.querySelector(".cm-mermaid-diagram");
    expect(diagram).not.toBeNull();

    // Edit Code mode via hover hint
    const editCodeBtn = container.querySelector<HTMLButtonElement>(
      ".cm-mermaid-edit-code-btn",
    );
    expect(editCodeBtn).not.toBeNull();
    editCodeBtn?.click();

    // Diagram replaced by code mode with View Diagram action
    expect(container.querySelector(".cm-mermaid-diagram")).toBeNull();
    const viewDiagramBtn = container.querySelector<HTMLButtonElement>(
      ".cm-mermaid-view-diagram-btn",
    );
    expect(viewDiagramBtn).not.toBeNull();

    // Returning to Diagram view
    viewDiagramBtn?.click();
    expect(container.querySelector(".cm-mermaid-diagram")).not.toBeNull();

    destroy();
  });

  it("shows an error placeholder instead of throwing for invalid syntax", async () => {
    const { container, destroy } = createMermaidEditor(
      "```mermaid\nnot a diagram\n```",
      true,
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(container.querySelector(".cm-mermaid-error")).not.toBeNull();
    destroy();
  });

  it("binds internal-link classes for quoted special-character nodes", async () => {
    let target = "";
    const { container, destroy } = createMermaidEditor(
      [
        "```mermaid",
        "graph TD",
        'A["⨳ special character"] --> B',
        "class A internal-link;",
        "```",
      ].join("\n"),
      true,
      (value) => {
        target = value;
      },
    );
    await new Promise((resolve) => setTimeout(resolve, 300));
    const link = container.querySelector<SVGGElement>(
      ".cm-mermaid-internal-link",
    );
    expect(link).not.toBeNull();
    link?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(target).toBe("A");
    destroy();
  });
});
