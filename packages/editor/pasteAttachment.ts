import { EditorView } from "@codemirror/view";

export type IncomingAttachmentHandler = (file: File, position: number) => Promise<string>;
export type PasteAttachmentHandler = IncomingAttachmentHandler;

const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif",
  "image/webp": "webp", "image/svg+xml": "svg", "audio/mpeg": "mp3",
  "audio/wav": "wav", "audio/mp4": "m4a", "video/mp4": "mp4",
  "video/webm": "webm", "video/quicktime": "mov", "application/pdf": "pdf",
};

export function pastedFileName(file: File): string {
  if (file.name) return file.name;
  const extension = MIME_EXTENSIONS[file.type] ?? "bin";
  return `pasted-${Date.now()}.${extension}`;
}

export function attachmentPasteHandler(
  onFile: IncomingAttachmentHandler,
  onError: (message: string) => void = () => {},
) {
  return EditorView.domEventHandlers({ paste: (event, view) =>
    handleAttachmentPaste(event, view, onFile, onError) });
}

export function handleAttachmentPaste(
  event: Event,
  view: EditorView,
  onFile: PasteAttachmentHandler,
  onError: (message: string) => void = () => {},
): boolean {
  const file = (event as ClipboardEvent).clipboardData?.files[0];
  if (!file) return false;
  event.preventDefault();
  const position = view.state.selection.main.head;
  void onFile(file, position)
    .then((syntax) => view.dispatch({ changes: { from: position, insert: syntax } }))
    .catch((error: unknown) => {
      const code = typeof error === "object" && error && "code" in error
        ? String(error.code) : "write-failed";
      const detail = error instanceof Error ? error.message : "Attachment paste failed.";
      onError(`Attachment ${code}: ${detail}`);
    });
  return true;
}

function reportAttachmentError(error: unknown, onError: (message: string) => void) {
  const code = typeof error === "object" && error && "code" in error
    ? String(error.code) : "write-failed";
  const detail = error instanceof Error ? error.message : "Attachment write failed.";
  onError(`Attachment ${code}: ${detail}`);
}

export async function handleIncomingFiles(
  files: readonly File[],
  position: number,
  view: EditorView,
  onFile: IncomingAttachmentHandler,
  onError: (message: string) => void = () => {},
): Promise<void> {
  const syntax: string[] = [];
  for (const file of files) {
    try {
      syntax.push(await onFile(file, position));
    } catch (error) {
      reportAttachmentError(error, onError);
    }
  }
  if (syntax.length > 0) {
    view.dispatch({ changes: { from: position, insert: syntax.join("\n") } });
  }
}

export function attachmentDropHandler(
  onFile: IncomingAttachmentHandler,
  onError: (message: string) => void = () => {},
) {
  return EditorView.domEventHandlers({
    dragover(event, view) {
      if (event.dataTransfer?.files.length) {
        event.preventDefault();
        view.dom.classList.add("cm-attachment-drag-over");
      }
      return false;
    },
    dragleave(event, view) {
      view.dom.classList.remove("cm-attachment-drag-over");
      return false;
    },
    drop(event, view) {
      const files = [...(event.dataTransfer?.files ?? [])];
      if (files.length === 0) return false;
      event.preventDefault();
      view.dom.classList.remove("cm-attachment-drag-over");
      const position = view.posAtCoords({ x: event.clientX, y: event.clientY })
        ?? view.state.selection.main.head;
      void handleIncomingFiles(files, position, view, onFile, onError);
      return true;
    },
  });
}
