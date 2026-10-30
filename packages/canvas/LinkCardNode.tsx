import {
  memo,
  useCallback,
  useMemo,
  useState,
  type JSX,
  type MouseEvent,
} from "react";
import {
  Handle,
  NodeResizer,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";
import { Globe } from "@phosphor-icons/react";
import {
  CANVAS_SNAP_GRID,
  DEFAULT_LINK_CARD_HEIGHT,
  DEFAULT_LINK_CARD_WIDTH,
  MIN_LINK_CARD_HEIGHT,
  MIN_LINK_CARD_WIDTH,
  snapToGrid,
} from "./canvasConstants";
import { useCanvasEditor } from "./CanvasEditorContext";
import { LinkCardHeader } from "./LinkCardHeader";
import { LinkCardUrlEditor } from "./LinkCardUrlEditor";
import { getEmbedUrl, SANDBOX_PERMISSIONS } from "./linkCardUtils";
import styles from "./LinkCardNode.module.scss";

export interface LinkCardNodeData {
  url?: string;
  type?: "link";
  color?: string;
  [key: string]: unknown;
}

function LinkCardNodeComponent({ id, data, selected }: NodeProps): JSX.Element {
  const { setNodes } = useReactFlow();
  const { onNodeUrlChange, onLayoutChange, isExporting } = useCanvasEditor();
  const url = typeof data.url === "string" ? data.url : "";
  const [isEditingUrl, setIsEditingUrl] = useState(false);

  const embedUrl = useMemo(() => getEmbedUrl(url), [url]);

  const handleResizeEnd = useCallback(
    (_event: unknown, p: { x: number; y: number; width: number; height: number }) => {
      setNodes((nodes) => {
        const next = nodes.map((node) => {
          if (node.id !== id) return node;
          const w = Number.isFinite(p.width)
            ? p.width
            : typeof node.style?.width === "number"
              ? node.style.width
              : DEFAULT_LINK_CARD_WIDTH;
          const h = Number.isFinite(p.height)
            ? p.height
            : typeof node.style?.height === "number"
              ? node.style.height
              : DEFAULT_LINK_CARD_HEIGHT;
          const posX = Number.isFinite(p.x) ? p.x : node.position.x;
          const posY = Number.isFinite(p.y) ? p.y : node.position.y;
          const [gx, gy] = CANVAS_SNAP_GRID;
          return {
            ...node,
            position: { x: snapToGrid(posX, gx), y: snapToGrid(posY, gy) },
            style: {
              ...node.style,
              width: snapToGrid(w, gx),
              height: snapToGrid(h, gy),
            },
          };
        });
        queueMicrotask(onLayoutChange);
        return next;
      });
    },
    [id, onLayoutChange, setNodes],
  );

  const handleSaveUrl = useCallback(
    (newUrl: string) => {
      setIsEditingUrl(false);
      if (onNodeUrlChange) {
        onNodeUrlChange(id, newUrl);
      }
    },
    [id, onNodeUrlChange],
  );

  const handleOpenExternal = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [url],
  );

  const cardClass = [styles["link-card"], selected ? styles["is-selected"] : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles["link-card-wrapper"]}>
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_LINK_CARD_WIDTH}
        minHeight={MIN_LINK_CARD_HEIGHT}
        onResizeEnd={handleResizeEnd}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className={styles["link-card__handle"]}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={styles["link-card__handle"]}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={styles["link-card__handle"]}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className={styles["link-card__handle"]}
      />

      <div className={cardClass} data-testid={`link-card-${id}`}>
        <LinkCardHeader
          url={url}
          isEditingUrl={isEditingUrl}
          onToggleEditUrl={() => setIsEditingUrl((v) => !v)}
          onOpenExternal={handleOpenExternal}
        />

        {isEditingUrl && (
          <LinkCardUrlEditor
            currentUrl={url}
            onSave={handleSaveUrl}
            onCancel={() => setIsEditingUrl(false)}
          />
        )}

        <div className={`${styles["link-card__body"]} nopan`}>
          {isExporting ? (
            <div
              className={styles["link-card__empty-state"]}
              data-testid="link-card-export-placeholder"
            >
              <Globe
                size={32}
                style={{
                  marginBottom: "var(--space-2)",
                  color: "var(--color-interactive-accent)",
                }}
              />
              <span
                style={{ fontWeight: 600, color: "var(--color-text-normal)" }}
              >
                Webpage Preview
              </span>
              <span
                style={{
                  fontSize: "11px",
                  wordBreak: "break-all",
                  opacity: 0.8,
                }}
                title={url}
              >
                {url}
              </span>
            </div>
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              title={url || "Webpage embed"}
              sandbox={SANDBOX_PERMISSIONS}
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen={true}
              className={styles["link-card__iframe"]}
              data-testid="link-card-iframe"
            />
          ) : (
            <div className={styles["link-card__empty-state"]}>
              <span>{url ? "Invalid webpage URL" : "No URL provided"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const LinkCardNode = memo(LinkCardNodeComponent);
