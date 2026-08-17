import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  type JSX,
} from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { useCanvasEditor } from "./CanvasEditorContext";
import { useMediaUrl } from "./useMediaUrl";
import styles from "./FileCardNode.module.scss";
import {
  configureWorkerSrc,
  renderPdfPage,
  type PdfDocumentProxy,
  type PdfPageSize,
  type PdfRenderTask,
} from "./pdfCardRenderer";
import { usePdfDocumentLoader } from "./usePdfDocumentLoader";
import { usePdfResizeObserver } from "./usePdfResizeObserver";

configureWorkerSrc();

export interface PdfCardViewProps {
  filePath: string;
}

function PdfCardViewComponent({ filePath }: PdfCardViewProps): JSX.Element {
  const { resolveMediaUrl } = useCanvasEditor();
  const { src, isLoading: urlLoading } = useMediaUrl(filePath, resolveMediaUrl);
  const { pdfDoc, pdfError, pageSizes } = usePdfDocumentLoader(src, urlLoading);
  const [viewportWidth, setViewportWidth] = useState<number>(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderTaskRefs = useRef<Map<number, PdfRenderTask>>(new Map());
  const pendingPagesRef = useRef<Set<number>>(new Set());
  const pdfDocRef = useRef<PdfDocumentProxy | null>(null);

  pdfDocRef.current = pdfDoc;

  const schedulePageRender = useCallback(
    (pageIndex: number, currentDoc: PdfDocumentProxy, scale: number) => {
      if (pendingPagesRef.current.has(pageIndex)) return;
      const canvas = canvasRefs.current.get(pageIndex);
      if (!canvas) return;
      const existing = renderTaskRefs.current.get(pageIndex);
      if (existing && typeof existing.cancel === "function") {
        try {
          existing.cancel();
        } catch {
          // ignore cancel errors
        }
        renderTaskRefs.current.delete(pageIndex);
      }
      pendingPagesRef.current.add(pageIndex);
      currentDoc
        .getPage(pageIndex + 1)
        .then((page) => {
          pendingPagesRef.current.delete(pageIndex);
          const task = renderPdfPage(page, canvas, scale);
          renderTaskRefs.current.set(pageIndex, task);
          task.promise
            .catch((err: unknown) => {
              const msg = err instanceof Error ? err.message : String(err);
              if (!msg.includes("Rendering cancelled")) {
                console.warn(`PDF page ${pageIndex + 1} render failed`);
              }
            })
            .finally(() => {
              if (renderTaskRefs.current.get(pageIndex) === task) {
                renderTaskRefs.current.delete(pageIndex);
              }
            });
        })
        .catch(() => {
          pendingPagesRef.current.delete(pageIndex);
        });
    },
    [],
  );

  const rerenderAllPages = useCallback(
    (doc: PdfDocumentProxy, containerWidth: number, sizes: PdfPageSize[]) => {
      if (containerWidth <= 0 || sizes.length === 0) return;
      const clamped = Math.max(
        0.1,
        Math.min(5, containerWidth / Math.max(1, sizes[0].width)),
      );
      for (let i = 0; i < doc.numPages; i += 1) {
        schedulePageRender(i, doc, clamped);
      }
    },
    [schedulePageRender],
  );

  usePdfResizeObserver({
    containerRef: scrollContainerRef,
    pdfDoc,
    pageSizes,
    onSize: setViewportWidth,
    rerenderAllPages,
  });

  const setCanvasRef = useCallback(
    (index: number) => {
      return (el: HTMLCanvasElement | null) => {
        if (el) {
          canvasRefs.current.set(index, el);
          const doc = pdfDocRef.current;
          if (doc && viewportWidth > 0 && pageSizes[index]) {
            const scale = viewportWidth / Math.max(1, pageSizes[index].width);
            schedulePageRender(index, doc, scale);
          }
        } else {
          canvasRefs.current.delete(index);
          const task = renderTaskRefs.current.get(index);
          if (task && typeof task.cancel === "function") {
            try {
              task.cancel();
            } catch {
              // ignore
            }
            renderTaskRefs.current.delete(index);
          }
        }
      };
    },
    [viewportWidth, pageSizes, schedulePageRender],
  );

  const pageStyles = useMemo(() => {
    return pageSizes.map((s) => {
      const scale =
        viewportWidth > 0 ? viewportWidth / Math.max(1, s.width) : 1;
      return {
        width: viewportWidth > 0 ? viewportWidth : s.width,
        height: s.height * Math.max(0.1, scale),
      };
    });
  }, [pageSizes, viewportWidth]);

  if (!filePath) {
    return (
      <div className={styles["file-card__empty-state"]}>
        <span>No PDF file selected</span>
      </div>
    );
  }

  if (urlLoading || (!src && !pdfError)) {
    return (
      <div className={styles["media-loading-state"]}>
        <span className={styles["media-loading-text"]}>Loading PDF...</span>
      </div>
    );
  }

  if (pdfError || !src) {
    return (
      <div className={styles["media-error-state"]} data-testid="pdf-error">
        <WarningCircle size={24} className={styles["media-error-icon"]} />
        <span className={styles["media-error-title"]}>
          {pdfError || "Failed to load PDF"}
        </span>
        <span className={styles["media-error-path"]} title={filePath}>
          {filePath}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className={styles["pdf-scroll-container"]}
      data-testid="pdf-scroll-container"
    >
      <div className={styles["pdf-pages-stack"]}>
        {pageStyles.map((style, idx) => (
          <div
            key={idx}
            className={styles["pdf-page-wrapper"]}
            style={{ width: style.width, height: style.height }}
          >
            <canvas
              ref={setCanvasRef(idx)}
              className={styles["pdf-page-canvas"]}
              data-testid={`pdf-page-${idx}`}
            />
          </div>
        ))}
        {pageStyles.length === 0 && (
          <div className={styles["media-loading-state"]}>
            <span className={styles["media-loading-text"]}>
              Loading pages...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export const PdfCardView = memo(PdfCardViewComponent);
