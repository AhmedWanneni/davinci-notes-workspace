import * as pdfjs from "pdfjs-dist";

export type PdfDocumentProxy = Awaited<
  ReturnType<typeof pdfjs.getDocument>["promise"]
>;
export type PdfPageProxy = Awaited<
  ReturnType<PdfDocumentProxy["getPage"]>
>;
export type PdfRenderTask = ReturnType<PdfPageProxy["render"]>;

export interface PdfPageSize {
  width: number;
  height: number;
}

export const RENDER_DEBOUNCE_MS = 120;

export function configureWorkerSrc(): void {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
  } catch {
    // Worker resolution skipped in environments where URL is not resolvable
    // (e.g. unit tests with mocked pdfjs-dist). Production always works.
  }
}

export function renderPdfPage(
  page: PdfPageProxy,
  canvas: HTMLCanvasElement,
  viewportScale: number,
): PdfRenderTask {
  const viewport = page.getViewport({ scale: viewportScale });
  const dpr = window.devicePixelRatio || 1;
  const outputScaleX = viewport.width > 0 ? Math.max(1, dpr) : 1;
  const outputScaleY = viewport.height > 0 ? Math.max(1, dpr) : 1;

  canvas.width = Math.floor(viewport.width * outputScaleX);
  canvas.height = Math.floor(viewport.height * outputScaleY);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { promise: Promise.resolve(), cancel: () => {} } as unknown as PdfRenderTask;
  }

  const transform =
    outputScaleX !== 1 || outputScaleY !== 1
      ? [outputScaleX, 0, 0, outputScaleY, 0, 0]
      : undefined;

  return page.render({
    canvasContext: ctx,
    viewport,
    transform,
  });
}
