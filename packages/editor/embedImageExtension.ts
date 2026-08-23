import { EditorState, Range, StateField } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";
import { resolveEmbedLink } from "./embedLinkResolution";
import { parseImageDimensions } from "./imageExtension";

export interface EmbedImageExtensionOptions {
  notePaths: readonly string[];
  resolveMediaUrl?: (path: string) => string;
  isReadOnly?: boolean;
}

const EMBED_LINE = /^\s*!\[\[([^\]]+)\]\]\s*$/;

class EmbedImageWidget extends WidgetType {
  constructor(
    readonly path: string,
    readonly width: number | undefined,
    readonly height: number | undefined,
    readonly resolveMediaUrl: (path: string) => string,
  ) { super(); }

  eq(other: EmbedImageWidget) {
    return this.path === other.path && this.width === other.width && this.height === other.height;
  }

  toDOM() {
    const container = document.createElement("div");
    container.className = "cm-file-image-embed";
    const image = document.createElement("img");
    image.src = this.resolveMediaUrl(this.path);
    image.alt = this.path;
    image.loading = "lazy";
    image.decoding = "async";
    if (this.width !== undefined) image.width = this.width;
    if (this.height !== undefined) image.height = this.height;
    if (this.width !== undefined && this.height === undefined) image.style.height = "auto";
    image.onerror = () => {
      container.className = "cm-file-image-embed cm-file-image-error";
      container.textContent = `Missing image: ${this.path}`;
    };
    container.appendChild(image);
    return container;
  }
}

class EmbedImagePlaceholder extends WidgetType {
  constructor(readonly message: string) { super(); }
  eq(other: EmbedImagePlaceholder) { return this.message === other.message; }
  toDOM() {
    const element = document.createElement("div");
    element.className = "cm-file-image-placeholder";
    element.textContent = this.message;
    return element;
  }
}

function decorations(state: EditorState, options: EmbedImageExtensionOptions): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const cursor = state.selection.main.head;
  const editable = !options.isReadOnly && state.facet(EditorView.editable);

  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
      const line = state.doc.line(lineNumber);
      const match = EMBED_LINE.exec(line.text);
      const active = editable && cursor >= line.from && cursor <= line.to;
      if (match && !active) {
        const inner = match[1]!;
        const [target] = inner.split("|");
        const dimensions = inner.includes("|")
          ? parseImageDimensions(inner.slice(inner.indexOf("|") + 1))
          : { width: undefined, height: undefined };
        const result = resolveEmbedLink(`![[${inner}]]`, { paths: options.notePaths });
        const imageResult = result.type === "image" ? result : undefined;
        const imageTarget = /\.(png|jpe?g|gif|webp|svg)$/i.test(target ?? "");
        let widget: WidgetType;
        if (imageResult) {
          widget = new EmbedImageWidget(
            imageResult.path,
            dimensions.width,
            dimensions.height,
            options.resolveMediaUrl ?? ((path) => path),
          );
        } else if (result.type === "ambiguous") {
          widget = new EmbedImagePlaceholder(`Multiple files match: ${target}`);
        } else if (imageTarget) {
          widget = new EmbedImagePlaceholder(`Missing image: ${target}`);
        } else {
          widget = new EmbedImagePlaceholder(`Cannot embed: ${target}`);
        }
        ranges.push(Decoration.replace({ widget, block: true }).range(line.from, line.to));
      }
  }
  return Decoration.set(ranges, true);
}

export function embedImageExtension(options: EmbedImageExtensionOptions) {
  return StateField.define<DecorationSet>({
    create: (state) => decorations(state, options),
    update: (value, transaction) => transaction.docChanged || transaction.selection
      ? decorations(transaction.state, options)
      : value,
    provide: (field) => EditorView.decorations.from(field),
  });
}
