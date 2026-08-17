declare module "pdfjs-dist" {
  export interface PdfJsViewport {
    width: number;
    height: number;
  }

  export interface PdfJsRenderParameters {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfJsViewport;
    transform?: number[];
  }

  export interface PdfJsRenderTask {
    promise: Promise<void>;
    cancel(): void;
  }

  export interface PdfJsPage {
    getViewport(params: { scale: number }): PdfJsViewport;
    render(params: PdfJsRenderParameters): PdfJsRenderTask;
  }

  export interface PdfJsDocument {
    numPages: number;
    getPage(pageNumber: number): Promise<PdfJsPage>;
    destroy(): Promise<void>;
  }

  export interface PdfJsDocumentLoadingTask {
    promise: Promise<PdfJsDocument>;
    onProgress: ((evt: { loaded: number; total: number }) => void) | undefined;
    destroy(): void;
  }

  export interface PdfJsGlobalWorkerOptions {
    workerSrc: string;
  }

  export const GlobalWorkerOptions: PdfJsGlobalWorkerOptions;
  export function getDocument(
    src: string | URL | Uint8Array | { data: Uint8Array } | { url: string },
  ): PdfJsDocumentLoadingTask;
  export const version: string;

  const pdfjs: {
    GlobalWorkerOptions: PdfJsGlobalWorkerOptions;
    getDocument: typeof getDocument;
    version: string;
  };

  export default pdfjs;
}
