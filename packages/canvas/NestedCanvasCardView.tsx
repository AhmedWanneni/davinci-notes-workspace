import {
  memo,
  useEffect,
  useMemo,
  useState,
  type JSX,
} from "react";
import {
  ArrowsCounterClockwise,
  SquaresFour,
  WarningCircle,
} from "@phosphor-icons/react";
import { CanvasEditorContext, useCanvasEditor } from "./CanvasEditorContext";
import { jsonCanvasToReactFlow } from "./canvasTranslation";
import {
  normalizeCanvasPath,
  validateNestedCanvas,
} from "./nestedCanvasUtils";
import { parseCanvas } from "./parseCanvas";
import { ReadOnlyCanvasFlow } from "./ReadOnlyCanvasFlow";
import styles from "./FileCardNode.module.scss";

export interface NestedCanvasCardViewProps {
  filePath: string;
}

function NestedCanvasCardViewComponent({
  filePath,
}: NestedCanvasCardViewProps): JSX.Element {
  const editorContext = useCanvasEditor();
  const {
    ancestorCanvasPaths = [],
    notesContent = {},
    readNoteContent,
  } = editorContext;

  const [asyncContent, setAsyncContent] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 1. Cycle & depth limit validation
  const validation = useMemo(
    () => validateNestedCanvas(filePath, ancestorCanvasPaths),
    [filePath, ancestorCanvasPaths],
  );

  const rawContent = notesContent[filePath] ?? asyncContent;

  // 2. Asynchronous content loading if not in memory
  useEffect(() => {
    if (!validation.valid || !filePath || notesContent[filePath] !== undefined || !readNoteContent) {
      return;
    }
    let isMounted = true;
    Promise.resolve(readNoteContent(filePath))
      .then((content) => {
        if (isMounted) {
          if (typeof content === "string") {
            setAsyncContent(content);
            setLoadError(null);
          } else {
            setLoadError("Invalid canvas data");
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setLoadError(err instanceof Error ? err.message : "Failed to load canvas");
        }
      });
    return () => {
      isMounted = false;
    };
  }, [filePath, notesContent, readNoteContent, validation.valid]);

  // 3. Child ancestor chain for deeper nested cards
  const childAncestorPaths = useMemo(
    () => [...ancestorCanvasPaths, normalizeCanvasPath(filePath)],
    [ancestorCanvasPaths, filePath],
  );

  const childContextValue = useMemo(
    () => ({
      ...editorContext,
      ancestorCanvasPaths: childAncestorPaths,
    }),
    [editorContext, childAncestorPaths],
  );

  // 4. Parse & translate JSON Canvas to React Flow nodes/edges
  const rfState = useMemo(() => {
    if (!rawContent) return null;
    try {
      const parsed = parseCanvas(rawContent);
      return jsonCanvasToReactFlow(parsed);
    } catch {
      return null;
    }
  }, [rawContent]);

  // Handle cycle detection blocked state
  if (!validation.valid && validation.reason === "cycle") {
    const chainDisplay = validation.cycleChain.join(" ➔ ");
    return (
      <div
        className={styles["nested-canvas-blocked-state"]}
        data-testid="nested-canvas-cycle-error"
      >
        <ArrowsCounterClockwise
          size={28}
          className={styles["nested-canvas-blocked-icon"]}
        />
        <span className={styles["nested-canvas-blocked-title"]}>
          Circular reference detected
        </span>
        <span className={styles["nested-canvas-cycle-chain"]} title={chainDisplay}>
          {chainDisplay}
        </span>
      </div>
    );
  }

  // Handle depth limit exceeded blocked state
  if (!validation.valid && validation.reason === "depth_limit") {
    return (
      <div
        className={styles["nested-canvas-blocked-state"]}
        data-testid="nested-canvas-depth-error"
      >
        <WarningCircle
          size={28}
          className={styles["nested-canvas-blocked-icon"]}
        />
        <span className={styles["nested-canvas-blocked-title"]}>
          Nesting limit reached
        </span>
        <span className={styles["nested-canvas-blocked-subtitle"]}>
          Maximum nesting depth of {validation.maxDepth} exceeded
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles["file-card__empty-state"]}>
        <span>{loadError}</span>
      </div>
    );
  }

  if (!rawContent && !rfState) {
    return (
      <div className={styles["file-card__empty-state"]}>
        <span>Loading canvas...</span>
      </div>
    );
  }

  if (rfState && rfState.nodes.length === 0) {
    return (
      <div
        className={styles["file-card__empty-state"]}
        data-testid="nested-canvas-empty-state"
      >
        <SquaresFour size={24} style={{ opacity: 0.5 }} />
        <span>Empty canvas</span>
      </div>
    );
  }

  return (
    <CanvasEditorContext.Provider value={childContextValue}>
      <div className={styles["nested-canvas-container"]}>
        {rfState && (
          <ReadOnlyCanvasFlow
            nodes={rfState.nodes}
            edges={rfState.edges}
            className={styles["nested-canvas-flow"]}
          />
        )}
      </div>
    </CanvasEditorContext.Provider>
  );
}

export const NestedCanvasCardView = memo(NestedCanvasCardViewComponent);
