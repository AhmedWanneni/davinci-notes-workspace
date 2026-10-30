import { EditorView, WidgetType } from "@codemirror/view";
import { createHoverHint } from "./mermaidHoverHint";
import { bindInternalLinks } from "./mermaidSvgInteractions";

export interface MermaidBlock {
  from: number;
  to: number;
  source: string;
  lineFrom: number;
  lineTo: number;
}

export interface MermaidExtensionOptions {
  isReadOnly?: boolean;
  onLinkClick: (targetRaw: string) => void;
}

let mermaidLoader: Promise<typeof import("mermaid").default> | null = null;
let mermaidInitialized = false;
let renderId = 0;

function loadMermaid() {
  mermaidLoader ??= import("mermaid").then((module) => module.default);
  return mermaidLoader;
}

function initMermaid(mermaid: typeof import("mermaid").default) {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
  });
  mermaidInitialized = true;
}

export class MermaidWidget extends WidgetType {
  constructor(
    readonly block: MermaidBlock,
    readonly view: EditorView,
    readonly options: MermaidExtensionOptions,
    readonly onEnterCodeEdit: (from: number) => void,
  ) {
    super();
  }

  eq(other: MermaidWidget) {
    return this.block.source === other.block.source;
  }

  toDOM() {
    const container = document.createElement("div");
    container.className = "cm-mermaid-diagram";

    const content = document.createElement("div");
    content.className = "cm-mermaid-diagram-content";
    content.textContent = "Rendering diagram…";

    const hint = createHoverHint({
      isReadOnly: this.options.isReadOnly,
      onEnterCodeEdit: () => this.onEnterCodeEdit(this.block.from),
    });

    if (hint) {
      container.appendChild(hint);
    }
    container.appendChild(content);

    const id = `cm-mermaid-${renderId++}`;
    loadMermaid()
      .then(async (mermaid) => {
        initMermaid(mermaid);
        const result = await mermaid.render(id, this.block.source);
        if (!container.isConnected) return;
        if (
          typeof result?.svg === "string" &&
          (result.svg.includes("Syntax error in text") ||
            result.svg.includes("mermaid version"))
        ) {
          container.className = "cm-mermaid-diagram cm-mermaid-error";
          content.textContent = "";
          return;
        }
        content.innerHTML = result.svg;
        bindInternalLinks(content, this.block.source, this.options.onLinkClick);
      })
      .catch(() => {
        if (!container.isConnected) return;
        container.className = "cm-mermaid-diagram cm-mermaid-error";
        content.textContent = "";
      });

    return container;
  }

  ignoreEvent() {
    return false;
  }
}

export class MermaidContinuationWidget extends WidgetType {
  toDOM() {
    const el = document.createElement("span");
    el.className = "cm-mermaid-continuation";
    return el;
  }
  eq() {
    return true;
  }
}
