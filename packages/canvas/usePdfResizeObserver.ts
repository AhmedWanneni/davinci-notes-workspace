import { useEffect, useRef } from "react";
import { RENDER_DEBOUNCE_MS } from "./pdfCardRenderer";
import type { PdfDocumentProxy, PdfPageSize } from "./pdfCardRenderer";

export interface UsePdfResizeObserverOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  pdfDoc: PdfDocumentProxy | null;
  pageSizes: PdfPageSize[];
  onSize: (width: number) => void;
  rerenderAllPages: (
    doc: PdfDocumentProxy,
    width: number,
    sizes: PdfPageSize[],
  ) => void;
}

export function usePdfResizeObserver({
  containerRef,
  pdfDoc,
  pageSizes,
  onSize,
  rerenderAllPages,
}: UsePdfResizeObserverOptions): void {
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const resizeRafRef = useRef<number>(0);
  const docRef = useRef<PdfDocumentProxy | null>(null);
  const sizesRef = useRef<PdfPageSize[]>([]);

  useEffect(() => {
    docRef.current = pdfDoc;
  }, [pdfDoc]);

  useEffect(() => {
    sizesRef.current = pageSizes;
  }, [pageSizes]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
    resizeObserverRef.current?.disconnect();

    const measureAndApply = () => {
      const width = container.clientWidth;
      onSize(width);
      const doc = docRef.current;
      const sizes = sizesRef.current;
      if (doc && sizes.length > 0 && width > 0) {
        rerenderAllPages(doc, width, sizes);
      }
    };

    let lastRun = 0;
    resizeObserverRef.current = new ResizeObserver(() => {
      const now = performance.now();
      const remaining = RENDER_DEBOUNCE_MS - (now - lastRun);
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
      const run = () => {
        resizeRafRef.current = requestAnimationFrame(() => {
          lastRun = performance.now();
          measureAndApply();
        });
      };
      if (remaining <= 0) run();
      else window.setTimeout(run, remaining);
    });
    resizeObserverRef.current.observe(container);
    measureAndApply();
    return () => {
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [pdfDoc, pageSizes, rerenderAllPages, containerRef, onSize]);
}
