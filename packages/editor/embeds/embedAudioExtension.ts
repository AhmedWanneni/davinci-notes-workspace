import { EditorState, Range, StateField } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";
import { resolveEmbedLink } from "./embedLinkResolution";

export interface EmbedAudioExtensionOptions {
  notePaths: readonly string[];
  resolveMediaUrl?: (path: string) => string;
  isReadOnly?: boolean;
}

const WIKILINK_EMBED_PATTERN = /!\[\[([^\]]+)\]\]/g;
const AUDIO_EXT_PATTERN = /\.(wav|mp3|m4a|ogg|aac|flac)$/i;

export class EmbedAudioWidget extends WidgetType {
  constructor(
    readonly path: string,
    readonly resolveMediaUrl: (path: string) => string,
    readonly isReadOnly?: boolean,
  ) {
    super();
  }

  eq(other: EmbedAudioWidget) {
    return this.path === other.path && this.isReadOnly === other.isReadOnly;
  }

  toDOM() {
    const container = document.createElement("div");
    container.className = "cm-file-audio-embed";
    container.setAttribute("data-audio-path", this.path);

    const header = document.createElement("div");
    header.className = "cm-file-audio-embed__header";

    const titleGroup = document.createElement("div");
    titleGroup.className = "cm-file-audio-embed__title-group";

    const icon = document.createElement("span");
    icon.className = "cm-file-audio-embed__icon";
    icon.textContent = "🎙️";

    const title = document.createElement("span");
    title.className = "cm-file-audio-embed__title";
    title.textContent = this.path.split(/[/\\]/).pop() ?? this.path;

    titleGroup.appendChild(icon);
    titleGroup.appendChild(title);
    header.appendChild(titleGroup);

    const rerunBtn = document.createElement("button");
    rerunBtn.type = "button";
    rerunBtn.className = "cm-file-audio-embed__rerun-btn";
    rerunBtn.textContent = "Re-run AI";
    rerunBtn.title = "Re-run transcription and AI note listening";
    rerunBtn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent("davinci:re-run-audio-transcription", {
          detail: { path: this.path },
        }),
      );
    };
    header.appendChild(rerunBtn);

    container.appendChild(header);

    const audio = document.createElement("audio");
    audio.controls = true;
    audio.preload = "metadata";
    audio.src = this.resolveMediaUrl(this.path);
    audio.className = "cm-file-audio-embed__player";
    container.appendChild(audio);

    return container;
  }
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
    if (!line.text.includes("![[")) continue;

    for (const match of line.text.matchAll(WIKILINK_EMBED_PATTERN)) {
      const matchIndex = match.index!;
      const start = line.from + matchIndex;
      const end = start + match[0].length;
      const isCursorInside = editable && cursor > start && cursor < end;
      if (isCursorInside) continue;

      const inner = match[1]!;
      const [target] = inner.split("|");
      const isAudioTarget = AUDIO_EXT_PATTERN.test(target ?? "");

      const result = resolveEmbedLink(`![[${inner}]]`, {
        paths: options.notePaths,
      });

      const audioPath =
        result.type === "audio"
          ? result.path
          : isAudioTarget && target
            ? target
            : undefined;

      if (!audioPath) continue;

      const widget = new EmbedAudioWidget(
        audioPath,
        options.resolveMediaUrl ?? ((p) => p),
        options.isReadOnly,
      );

      ranges.push(
        Decoration.replace({ widget, inclusive: false }).range(start, end),
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
