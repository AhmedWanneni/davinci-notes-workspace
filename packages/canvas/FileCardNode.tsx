import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useState, type JSX } from "react";
import { Handle, NodeResizer, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import { MarkdownView } from "@app/editor";
import { CANVAS_SNAP_GRID, MIN_FILE_CARD_HEIGHT, MIN_FILE_CARD_WIDTH, snapToGrid } from "./canvasConstants";
import { useCanvasEditor } from "./CanvasEditorContext";
import { CanvasCardActionBar } from "./CanvasCardActionBar";
import { getCanvasEdgeColorCss } from "./canvasEdgeConstants";
import type { CanvasColor } from "./CanvasColor";
import { FileCardHeader } from "./FileCardHeader";
import { FileCardHeadingPicker } from "./FileCardHeadingPicker";
import { FileCardSwapPicker } from "./FileCardSwapPicker";
import { MediaCardView } from "./MediaCardView";
import { getFileCardType } from "./mediaCardUtils";
import { extractHeadings, extractSectionByHeading } from "./subpathUtils";
import styles from "./FileCardNode.module.scss";

const LazyPdfCardView = lazy(() => import("./PdfCardView").then((m) => ({ default: m.PdfCardView })));
const LazyNestedCanvasCardView = lazy(() => import("./NestedCanvasCardView").then((m) => ({ default: m.NestedCanvasCardView })));

export interface FileCardNodeData {
  file?: string;
  subpath?: string;
  type?: "file";
  color?: string;
  [key: string]: unknown;
}

function FileCardNodeComponent({ id, data, selected }: NodeProps): JSX.Element {
  const { setNodes, fitView } = useReactFlow();
  const {
    allNotePaths = [],
    notesContent = {},
    readNoteContent,
    onOpenFile,
    onNodeFileChange,
    onLayoutChange,
    onDeleteNode,
    onNodeColorChange,
  } = useCanvasEditor();

  const file = typeof data.file === "string" ? data.file : "";
  const subpath = typeof data.subpath === "string" ? data.subpath : undefined;
  const color = typeof data.color === "string" ? data.color : undefined;
  const fileType = useMemo(() => getFileCardType(file), [file]);

  const [asyncContent, setAsyncContent] = useState<string | null>(null);
  const [showSwapPicker, setShowSwapPicker] = useState(false);
  const [showHeadingPicker, setShowHeadingPicker] = useState(false);

  const rawContent = notesContent[file] ?? asyncContent ?? "";

  // Load content asynchronously if markdown and not available in memory store
  useEffect(() => {
    if (fileType !== "markdown" || !file || notesContent[file] !== undefined || !readNoteContent) {
      return;
    }
    let isMounted = true;
    Promise.resolve(readNoteContent(file))
      .then((content) => {
        if (isMounted && typeof content === "string") setAsyncContent(content);
      })
      .catch(() => {
        if (isMounted) setAsyncContent(null);
      });
    return () => {
      isMounted = false;
    };
  }, [file, fileType, notesContent, readNoteContent]);

  const displayContent = useMemo(() => {
    if (fileType !== "markdown") return "";
    return extractSectionByHeading(rawContent, subpath);
  }, [fileType, rawContent, subpath]);

  const headings = useMemo(() => {
    if (fileType !== "markdown") return [];
    return extractHeadings(rawContent);
  }, [fileType, rawContent]);

  const handleResizeEnd = useCallback(
    (_event: unknown, p: { x: number; y: number; width: number; height: number }) => {
      setNodes((nodes) => {
        const next = nodes.map((node) => {
          if (node.id !== id) return node;
          const w = Number.isFinite(p.width) ? p.width : (typeof node.style?.width === "number" ? node.style.width : 400);
          const h = Number.isFinite(p.height) ? p.height : (typeof node.style?.height === "number" ? node.style.height : 320);
          const posX = Number.isFinite(p.x) ? p.x : node.position.x;
          const posY = Number.isFinite(p.y) ? p.y : node.position.y;
          const [gx, gy] = CANVAS_SNAP_GRID;
          return {
            ...node,
            position: { x: snapToGrid(posX, gx), y: snapToGrid(posY, gy) },
            style: { ...node.style, width: snapToGrid(w, gx), height: snapToGrid(h, gy) },
          };
        });
        queueMicrotask(onLayoutChange);
        return next;
      });
    },
    [id, onLayoutChange, setNodes],
  );

  const handleSwapFile = useCallback(
    (newPath: string) => {
      setShowSwapPicker(false);
      if (onNodeFileChange) onNodeFileChange(id, newPath, undefined);
    },
    [id, onNodeFileChange],
  );

  const handleSelectHeading = useCallback(
    (headingText?: string) => {
      setShowHeadingPicker(false);
      if (onNodeFileChange) {
        onNodeFileChange(id, file, headingText ? `# ${headingText}` : undefined);
      }
    },
    [file, id, onNodeFileChange],
  );

  const cardClass = [styles["file-card"], selected ? styles["is-selected"] : ""]
    .filter(Boolean)
    .join(" ");

  const cardBorderColor = color ? getCanvasEdgeColorCss(color as CanvasColor) : undefined;

  return (
    <div className={styles["file-card-wrapper"]}>
      <CanvasCardActionBar
        selected={Boolean(selected)}
        onDelete={() => onDeleteNode?.(id)}
        onColorChange={(c) => onNodeColorChange?.(id, c as CanvasColor)}
        onZoomTo={() => void fitView({ nodes: [{ id }], duration: 300, padding: 0.3 })}
        onEdit={fileType === "markdown" ? () => onOpenFile?.(file) : undefined}
      />
      <NodeResizer
        isVisible={selected}
        keepAspectRatio={fileType === "image"}
        minWidth={MIN_FILE_CARD_WIDTH}
        minHeight={MIN_FILE_CARD_HEIGHT}
        onResizeEnd={handleResizeEnd}
      />
      <Handle type="source" position={Position.Top} id="top" className={styles["file-card__handle"]} />
      <Handle type="source" position={Position.Right} id="right" className={styles["file-card__handle"]} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={styles["file-card__handle"]} />
      <Handle type="source" position={Position.Left} id="left" className={styles["file-card__handle"]} />

      <div
        className={cardClass}
        style={cardBorderColor ? { borderColor: cardBorderColor } : undefined}
        data-testid={`file-card-${id}`}
      >
        <FileCardHeader
          file={file}
          subpath={subpath}
          fileType={fileType}
          hasHeadings={headings.length > 0}
          onToggleHeadingPicker={() => {
            setShowHeadingPicker((v) => !v);
            setShowSwapPicker(false);
          }}
          onToggleSwapPicker={() => {
            setShowSwapPicker((v) => !v);
            setShowHeadingPicker(false);
          }}
          onOpenFile={onOpenFile}
        />

        {showSwapPicker && (
          <FileCardSwapPicker paths={allNotePaths} onSelect={handleSwapFile} />
        )}

        {showHeadingPicker && (
          <FileCardHeadingPicker headings={headings} onSelect={handleSelectHeading} />
        )}

        <div className={`${styles["file-card__body"]} nopan`}>
          {fileType === "image" || fileType === "video" ? (
            <MediaCardView filePath={file} mediaType={fileType} />
          ) : fileType === "pdf" && file ? (
            <Suspense
              fallback={
                <div className={styles["media-loading-state"]}>
                  <span className={styles["media-loading-text"]}>
                    Loading PDF viewer...
                  </span>
                </div>
              }
            >
              <LazyPdfCardView filePath={file} />
            </Suspense>
          ) : fileType === "canvas" && file ? (
            <Suspense
              fallback={
                <div className={styles["media-loading-state"]}>
                  <span className={styles["media-loading-text"]}>
                    Loading canvas preview...
                  </span>
                </div>
              }
            >
              <LazyNestedCanvasCardView filePath={file} />
            </Suspense>
          ) : fileType === "markdown" && file ? (
            <MarkdownView
              value={displayContent}
              notePaths={allNotePaths}
              sourcePath={file}
              onLinkClick={onOpenFile}
            />
          ) : (
            <div className={styles["file-card__empty-state"]}>
              <span>{file ? "Unsupported file format" : "No file selected"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export const FileCardNode = memo(FileCardNodeComponent);
