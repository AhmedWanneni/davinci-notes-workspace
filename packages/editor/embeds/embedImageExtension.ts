import { EditorState, Range, StateField } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";
import { resolveEmbedLink } from "./embedLinkResolution";
import { parseImageDimensions } from "./imageExtension";
import { attachImageResizeOverlay } from "./imageResizeOverlay";
import { updateEmbedWidthInText } from "./imageResizeSyntax";

export interface EmbedImageExtensionOptions {
  notePaths: readonly string[];
  resolveMediaUrl?: (path: string) => string;
  isReadOnly?: boolean;
}

const WIKILINK_EMBED_PATTERN = /!\[\[([^\]]+)\]\]/g;

class EmbedImageWidget extends WidgetType {
  constructor(
    readonly path: string,
    readonly width: number | undefined,
    readonly height: number | undefined,
    readonly resolveMediaUrl: (path: string) => string,
    readonly isReadOnly?: boolean,
  ) {
    super();
  }

  eq(other: EmbedImageWidget) {
    return (
      this.path === other.path &&
      this.width === other.width &&
      this.height === other.height &&
      this.isReadOnly === other.isReadOnly
    );
  }

  toDOM(view: EditorView) {
    const container = document.createElement("div");
    container.className = "cm-file-image-embed";
    const image = document.createElement("img");
    image.src = this.resolveMediaUrl(this.path);
    image.alt = this.path;
    image.loading = "lazy";
    image.decoding = "async";
    if (this.width !== undefined) image.width = this.width;
    if (this.height !== undefined) image.height = this.height;
    if (this.width !== undefined && this.height === undefined)
      image.style.height = "auto";
    image.onerror = () => {
      console.error(
        "[EmbedImage] Failed to load image:",
        this.path,
        "src:",
        image.src,
      );
      container.className = "cm-file-image-embed cm-file-image-error";
      container.textContent = `Missing image: ${this.path}`;
    };
    container.appendChild(image);

    const editable =
      !this.isReadOnly && (!view || view.state.facet(EditorView.editable));
    if (editable) {
      attachImageResizeOverlay({
        container,
        image,
        currentWidth: this.width,
        currentHeight: this.height,
        isReadOnly: !editable,
        onCommitWidth: (newWidth) => {
          if (!view) return;
          const pos = view.posAtDOM(container);
          if (pos === null || pos < 0) return;
          const line = view.state.doc.lineAt(pos);
          const newText = updateEmbedWidthInText(line.text, newWidth);
          if (newText !== line.text) {
            view.dispatch({
              changes: { from: line.from, to: line.to, insert: newText },
            });
          }
        },
      });
    }

    return container;
  }
}

class EmbedImagePlaceholder extends WidgetType {
  constructor(readonly message: string) {
    super();
  }
  eq(other: EmbedImagePlaceholder) {
    return this.message === other.message;
  }
  toDOM() {
    const element = document.createElement("div");
    element.className = "cm-file-image-placeholder";
    element.textContent = this.message;
    return element;
  }
}

function decorations(
  state: EditorState,
  options: EmbedImageExtensionOptions,
): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const cursor = state.selection.main.head;
  const editable = !options.isReadOnly && state.facet(EditorView.editable);

  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
    const line = state.doc.line(lineNumber);
    if (!line.text.includes("![[")) continue;

    for (const match of line.text.matchAll(WIKILINK_EMBED_PATTERN)) {
      const matchIndex = match.index!;
      const start = line.from + matchIndex;
      const end = start + match[0].length;
      const isCursorInside = editable && cursor > start && cursor < end;
      if (isCursorInside) {
        continue;
      }

      const inner = match[1]!;
      const [target] = inner.split("|");
      const dimensions = inner.includes("|")
        ? parseImageDimensions(inner.slice(inner.indexOf("|") + 1))
        : { width: undefined, height: undefined };
      const result = resolveEmbedLink(`![[${inner}]]`, {
        paths: options.notePaths,
      });
      const imageResult = result.type === "image" ? result : undefined;
      const imageTarget = /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(
        target ?? "",
      );
      if (!imageResult && !imageTarget) {
        continue;
      }

      let widget: WidgetType;
      if (imageResult) {
        widget = new EmbedImageWidget(
          imageResult.path,
          dimensions.width,
          dimensions.height,
          options.resolveMediaUrl ?? ((path) => path),
          options.isReadOnly,
        );
      } else if (result.type === "ambiguous") {
        widget = new EmbedImagePlaceholder(`Multiple files match: ${target}`);
      } else if (
        imageTarget &&
        target &&
        (target.includes("/") || target.includes("\\"))
      ) {
        widget = new EmbedImageWidget(
          target,
          dimensions.width,
          dimensions.height,
          options.resolveMediaUrl ?? ((path) => path),
          options.isReadOnly,
        );
      } else {
        widget = new EmbedImagePlaceholder(`Missing image: ${target}`);
      }
      ranges.push(
        Decoration.replace({ widget, inclusive: false }).range(start, end),
      );
    }
  }
  return Decoration.set(ranges, true);
}

export function embedImageExtension(options: EmbedImageExtensionOptions) {
  return StateField.define<DecorationSet>({
    create: (state) => decorations(state, options),
    update: (value, transaction) =>
      transaction.docChanged || transaction.selection
        ? decorations(transaction.state, options)
        : value,
    provide: (field) => EditorView.decorations.from(field),
  });
}
