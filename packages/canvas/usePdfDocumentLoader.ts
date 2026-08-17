import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import type { PdfDocumentProxy, PdfPageSize } from "./pdfCardRenderer";

export interface UsePdfDocumentLoaderResult {
  pdfDoc: PdfDocumentProxy | null;
  pdfError: string | null;
  pageSizes: PdfPageSize[];
}

export function usePdfDocumentLoader(
  src: string | null,
  urlLoading: boolean,
): UsePdfDocumentLoaderResult {
  const [pdfDoc, setPdfDoc] = useState<PdfDocumentProxy | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pageSizes, setPageSizes] = useState<PdfPageSize[]>([]);

  const loadAbortRef = useRef<{ destroyed: boolean }>({ destroyed: false });
  const pdfDocRef = useRef<PdfDocumentProxy | null>(null);

  useEffect(() => {
    pdfDocRef.current = pdfDoc;
  }, [pdfDoc]);

  useEffect(() => {
    if (urlLoading || !src) return;
    loadAbortRef.current.destroyed = false;
    setPdfDoc(null);
    setPdfError(null);
    setPageSizes([]);
    pdfDocRef.current = null;
    const loading = pdfjs.getDocument(src);
    loading.onProgress = () => {};
    loading.promise
      .then((doc) => {
        if (loadAbortRef.current.destroyed) {
          doc.destroy();
          return;
        }
        const loaded = doc as unknown as PdfDocumentProxy;
        setPdfDoc(loaded);
        pdfDocRef.current = loaded;
        const sizePromises: Promise<PdfPageSize>[] = [];
        for (let i = 1; i <= loaded.numPages; i += 1) {
          sizePromises.push(
            loaded.getPage(i).then((page) => {
              const vp = page.getViewport({ scale: 1 });
              return { width: vp.width, height: vp.height };
            }),
          );
        }
        Promise.all(sizePromises)
          .then((sizes) => {
            if (!loadAbortRef.current.destroyed) setPageSizes(sizes);
          })
          .catch(() => {
            if (!loadAbortRef.current.destroyed)
              setPdfError("Failed to read PDF pages");
          });
      })
      .catch((err: unknown) => {
        if (!loadAbortRef.current.destroyed) {
          const msg = err instanceof Error ? err.message : "Failed to load PDF";
          setPdfError(msg);
        }
      });
    return () => {
      loadAbortRef.current.destroyed = true;
      try {
        loading.destroy();
      } catch {
        // ignore destroy errors during cleanup
      }
    };
  }, [src, urlLoading]);

  useEffect(() => {
    return () => {
      loadAbortRef.current.destroyed = true;
      const doc = pdfDocRef.current;
      if (doc && typeof doc.destroy === "function") {
        doc.destroy().catch(() => {});
      }
      pdfDocRef.current = null;
    };
  }, []);

  return { pdfDoc, pdfError, pageSizes };
}
