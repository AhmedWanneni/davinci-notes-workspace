import { EditorState, Range, StateField } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";
import { resolveEmbedLink } from "./embedLinkResolution";
import {
  MAX_EMBED_DEPTH,
  type NoteEmbedOptions,
} from "./noteEmbedTypes";
import {
  NoteEmbedPlaceholderWidget,
  NoteEmbedPlainLinkWidget,
} from "./noteEmbedPlaceholderWidgets";
import { NoteEmbedWidget } from "./NoteEmbedWidget";

const EMBED_LINE = /^\s*!\[\[([^\]]+)\]\]\s*$/;
const NON_NOTE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|pdf|mp3|wav|m4a|mp4|webm|mov)$/i;

function decorations(
  state: EditorState,
  options: NoteEmbedOptions,
): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const cursor = state.selection.main.head;
  const editable = !options.isReadOnly && state.facet(EditorView.editable);

  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
    const line = state.doc.line(lineNumber);
    const match = EMBED_LINE.exec(line.text);
    const active = editable && cursor >= line.from && cursor <= line.to;

    if (match && !active) {
      const inner = match[1]!;
      const targetSegment = inner.split("|")[0]!.trim();
      const rawTarget = targetSegment.split("#")[0]!.trim();

      // Non-note targets keep their existing behavior
      if (NON_NOTE_EXTENSIONS.test(rawTarget)) {
        continue;
      }

      const result = resolveEmbedLink(`![[${inner}]]`, {
        paths: options.notePaths,
        noteContents: options.noteContents,
      });

      let widget: WidgetType | null = null;
      const chain =
        options.embedChain ??
        (options.sourcePath ? [options.sourcePath] : []);

      if (result.type === "note") {
        const isCircular = chain.includes(result.path);
        if (isCircular) {
          widget = new NoteEmbedPlaceholderWidget(
            "Circular embed",
            "cm-note-embed-circular",
          );
        } else if (chain.length >= MAX_EMBED_DEPTH) {
          widget = new NoteEmbedPlainLinkWidget(
            targetSegment,
            options.onLinkClick,
          );
        } else {
          widget = new NoteEmbedWidget(
            result.path,
            result.heading,
            line.text.trim(),
            options,
            noteEmbedExtension,
          );
        }
      } else if (result.type === "ambiguous") {
        widget = new NoteEmbedPlaceholderWidget(
          `Multiple notes match: ${rawTarget}`,
          "cm-note-embed-muted",
        );
      } else if (result.type === "heading-not-found") {
        widget = new NoteEmbedPlaceholderWidget(
          `Heading not found: #${result.heading} in [[${result.path}]]`,
          "cm-note-embed-muted",
        );
      } else if (result.type === "unresolved") {
        widget = new NoteEmbedPlaceholderWidget(
          `Note not found: ![[${inner}]]`,
          "cm-note-embed-muted",
        );
      }

      if (widget) {
        ranges.push(
          Decoration.replace({ widget, block: true }).range(
            line.from,
            line.to,
          ),
        );
      }
    }
  }

  return Decoration.set(ranges, true);
}

export function noteEmbedExtension(options: NoteEmbedOptions) {
  return StateField.define<DecorationSet>({
    create: (state) => decorations(state, options),
    update: (value, transaction) =>
      transaction.docChanged || transaction.selection
        ? decorations(transaction.state, options)
        : value,
    provide: (field) => EditorView.decorations.from(field),
  });
}
