import { EditorState, Range, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import { resolveEmbedLink } from "./embedLinkResolution";
import { EmbedAudioWidget } from "./EmbedAudioWidget";

export interface EmbedAudioExtensionOptions {
  notePaths: readonly string[];
  sourcePath?: string;
  resolveMediaUrl?: (path: string) => string;
  isReadOnly?: boolean;
}

const WIKILINK_EMBED_PATTERN = /!\[\[([^\]]+)\]\]/g;
const WIKILINK_AUDIO_PATTERN =
  /(?<!!)\[\[([^\]]+\.(?:wav|mp3|m4a|ogg|aac|flac|webm)(?:\|[^\]]+)?)\]\]/gi;
const MARKDOWN_AUDIO_PATTERN =
  /!?\[([^\]]*)\]\(([^)\s]+\.(?:wav|mp3|m4a|ogg|aac|flac|webm))\)/gi;
const AUDIO_EXT_PATTERN = /\.(wav|mp3|m4a|ogg|aac|flac|webm)$/i;

function resolveAudioPathCandidate(
  target: string,
  notePaths?: readonly string[],
  sourcePath?: string,
): string {
  if (target.includes("/")) return target;
  if (sourcePath && sourcePath.includes("/")) {
    const parentDir = sourcePath.substring(0, sourcePath.lastIndexOf("/"));
    return `${parentDir}/${target}`;
  }
  if (!notePaths || notePaths.length === 0) return target;
  const lower = target.toLowerCase();
  const found = notePaths.find(
    (p) =>
      p === target ||
      p.endsWith(`/${target}`) ||
      p.toLowerCase() === lower ||
      p.toLowerCase().endsWith(`/${lower}`),
  );
  return found ?? target;
}

function audioDecorations(
  state: EditorState,
  options: EmbedAudioExtensionOptions,
): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const cursor = state.selection.main.head;
  const editable = !options.isReadOnly && state.facet(EditorView.editable);

  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber += 1) {
    const line = state.doc.line(lineNumber);
    if (!line.text.includes("[") && !line.text.includes("(")) continue;

    const matches: { start: number; end: number; target: string }[] = [];

    for (const match of line.text.matchAll(WIKILINK_EMBED_PATTERN)) {
      const matchIndex = match.index!;
      const inner = match[1]!;
      const [target] = inner.split("|");
      const isAudio = AUDIO_EXT_PATTERN.test(target ?? "");
      const res = resolveEmbedLink(`![[${inner}]]`, {
        paths: options.notePaths,
      });
      const path =
        res.type === "audio"
          ? res.path
          : isAudio && target
            ? target
            : undefined;
      if (path) {
        matches.push({
          start: line.from + matchIndex,
          end: line.from + matchIndex + match[0].length,
          target: path,
        });
      }
    }

    for (const match of line.text.matchAll(WIKILINK_AUDIO_PATTERN)) {
      const matchIndex = match.index!;
      const inner = match[1]!;
      const [target] = inner.split("|");
      if (target && AUDIO_EXT_PATTERN.test(target)) {
        matches.push({
          start: line.from + matchIndex,
          end: line.from + matchIndex + match[0].length,
          target,
        });
      }
    }

    for (const match of line.text.matchAll(MARKDOWN_AUDIO_PATTERN)) {
      const matchIndex = match.index!;
      const target = match[2];
      if (target && AUDIO_EXT_PATTERN.test(target)) {
        matches.push({
          start: line.from + matchIndex,
          end: line.from + matchIndex + match[0].length,
          target,
        });
      }
    }

    matches.sort((a, b) => a.start - b.start);

    let lastEnd = -1;
    for (const item of matches) {
      if (item.start < lastEnd) continue;
      lastEnd = item.end;

      const isCursorInside =
        editable && cursor > item.start && cursor < item.end;
      if (isCursorInside) continue;

      const resolved = resolveAudioPathCandidate(
        item.target,
        options.notePaths,
        options.sourcePath,
      );
      const widget = new EmbedAudioWidget(
        resolved,
        options.resolveMediaUrl ?? ((p) => p),
        options.isReadOnly,
      );

      ranges.push(
        Decoration.replace({ widget, inclusive: false }).range(
          item.start,
          item.end,
        ),
      );
    }
  }

  return Decoration.set(ranges, true);
}

export function embedAudioExtension(options: EmbedAudioExtensionOptions) {
  return StateField.define<DecorationSet>({
    create: (state) => audioDecorations(state, options),
    update: (value, transaction) =>
      transaction.docChanged || transaction.selection
        ? audioDecorations(transaction.state, options)
        : value,
    provide: (field) => EditorView.decorations.from(field),
  });
}
export { EmbedAudioWidget };
