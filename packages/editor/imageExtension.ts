import { Range } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";

export interface ImageDimensions {
  alt: string;
  width?: number;
  height?: number;
}

export function parseImageDimensions(rawAlt: string): ImageDimensions {
  const pipeIndex = rawAlt.lastIndexOf("|");
  if (pipeIndex !== -1) {
    const alt = rawAlt.slice(0, pipeIndex);
    const dimPart = rawAlt.slice(pipeIndex + 1).trim();
    const match = /^(\d+)(?:x(\d+))?$/.exec(dimPart);
    if (match) {
      const width = parseInt(match[1], 10);
      const height = match[2] ? parseInt(match[2], 10) : undefined;
      return { alt, width, height };
    }
  } else {
    const match = /^(\d+)(?:x(\d+))?$/.exec(rawAlt.trim());
    if (match) {
      const width = parseInt(match[1], 10);
      const height = match[2] ? parseInt(match[2], 10) : undefined;
      return { alt: "", width, height };
    }
  }

  return { alt: rawAlt };
}

export function sanitizeImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export const IMAGE_PATTERN = /!(?:\[([^\]]*)\])\((<[^>\n]+>|[^)\s]+)\)/g;

class ImageWidget extends WidgetType {
  constructor(
    readonly url: string,
    readonly alt: string,
    readonly width?: number,
    readonly height?: number,
  ) {
    super();
  }

  eq(other: ImageWidget): boolean {
    return (
      this.url === other.url &&
      this.alt === other.alt &&
      this.width === other.width &&
      this.height === other.height
    );
  }

  toDOM(): HTMLElement {
    const container = document.createElement("span");
    container.className = "cm-image-embed";

    const img = document.createElement("img");
    img.src = this.url;
    img.alt = this.alt;
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    img.loading = "lazy";
    img.decoding = "async";

    if (this.width !== undefined) {
      img.style.width = `${this.width}px`;
      img.setAttribute("width", `${this.width}`);
    }
    if (this.height !== undefined) {
      img.style.height = `${this.height}px`;
      img.setAttribute("height", `${this.height}`);
    } else if (this.width !== undefined) {
      img.style.height = "auto";
    }

    img.onerror = () => {
      container.className = "cm-image-embed cm-image-error";
      container.textContent = this.alt
        ? `[Image: ${this.alt}]`
        : "[Image failed to load]";
    };

    container.appendChild(img);
    return container;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

export interface ImageExtensionOptions {
  isReadOnly?: boolean;
}

export function imageExtension(options: ImageExtensionOptions = {}) {
  const getImageDecos = (view: EditorView): DecorationSet => {
    const builder: Range<Decoration>[] = [];
    const state = view.state;
    const isReadOnly = options.isReadOnly || !state.facet(EditorView.editable);

    const activeLineNumber = !isReadOnly
      ? state.doc.lineAt(state.selection.main.head).number
      : -1;

    for (const { from, to } of view.visibleRanges) {
      const lineStart = state.doc.lineAt(from).from;
      const lineEnd = state.doc.lineAt(to).to;
      const chunkText = state.doc.sliceString(lineStart, lineEnd);

      for (const match of chunkText.matchAll(IMAGE_PATTERN)) {
        const start = lineStart + match.index!;
        const end = lineStart + match.index! + match[0].length;
        const rawAlt = match[1] ?? "";
        const rawUrl = match[2] ?? "";

        const line = state.doc.lineAt(start);
        if (!isReadOnly && line.number === activeLineNumber) {
          continue;
        }

        const { alt, width, height } = parseImageDimensions(rawAlt);
        const url = sanitizeImageUrl(rawUrl);

        builder.push(
          Decoration.replace({
            widget: new ImageWidget(url, alt, width, height),
          }).range(start, end),
        );
      }
    }

    builder.sort((a, b) => a.from - b.from);
    return Decoration.set(builder);
  };

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = getImageDecos(view);
      }

      update(update: ViewUpdate) {
        if (
          update.docChanged ||
          update.viewportChanged ||
          update.selectionSet
        ) {
          this.decorations = getImageDecos(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );
}
