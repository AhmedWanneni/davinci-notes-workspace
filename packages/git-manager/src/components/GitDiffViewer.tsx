import { useEffect, useRef, useState, useMemo } from "react";
import { EditorView, lineNumbers } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { MergeView, unifiedMergeView } from "@codemirror/merge";
import {
  X,
  Plus,
  Minus,
  ArrowDown,
  ArrowUp,
  CaretRight,
  Columns,
  Rows,
} from "@phosphor-icons/react";
import type { GitFileDiff } from "../types/gitTypes";
import { fetchFileDiff } from "../api/gitClient";
import { useGitManagerStore } from "../store/useGitManagerStore";
import { useGitSyncStore } from "../store/useGitSyncStore";
import { gitDiffTheme } from "./gitDiffTheme";
import styles from "./GitDiffViewer.module.scss";

export interface GitDiffViewerProps {
  diff?: GitFileDiff;
  diffUri?: string;
  onClose?: () => void;
}

export function GitDiffViewer({
  diff: propDiff,
  diffUri,
  onClose,
}: GitDiffViewerProps) {
  const [resolvedDiff, setResolvedDiff] = useState<GitFileDiff | null>(
    propDiff ?? null,
  );
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "inline">("split");

  const containerRef = useRef<HTMLDivElement>(null);
  const mergeViewRef = useRef<MergeView | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  const { stagePaths, unstagePaths, refreshStatus } = useGitManagerStore();
  const { pull, push, isSyncing } = useGitSyncStore();

  // Parse diffUri if provided: git-diff://path/to/file?staged=0&status=M
  const uriParsed = useMemo(() => {
    if (!diffUri) return null;
    const raw = diffUri.replace(/^git-diff:\/\//, "");
    const [path, query] = raw.split("?");
    const isStaged = query?.includes("staged=1") ?? false;
    const statusMatch = query?.match(/status=([A-Z])/);
    const statusCode = statusMatch ? statusMatch[1] : "M";
    return { path, isStaged, statusCode };
  }, [diffUri]);

  // Load diff from URI
  useEffect(() => {
    if (propDiff) {
      setResolvedDiff(propDiff);
      return;
    }
    if (!uriParsed) return;

    let isMounted = true;
    setIsLoadingDiff(true);
    void fetchFileDiff(uriParsed.path, uriParsed.isStaged)
      .then((data) => {
        if (isMounted) setResolvedDiff(data);
      })
      .catch((err) => console.error("Failed to load file diff:", err))
      .finally(() => {
        if (isMounted) setIsLoadingDiff(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propDiff, uriParsed]);

  // Render CodeMirror view (Side-by-side or Inline)
  useEffect(() => {
    if (!containerRef.current || !resolvedDiff) return;

    // Destroy existing instances
    mergeViewRef.current?.destroy();
    mergeViewRef.current = null;
    editorViewRef.current?.destroy();
    editorViewRef.current = null;

    if (viewMode === "split") {
      const mv = new MergeView({
        a: {
          doc: resolvedDiff.originalContent,
          extensions: [
            lineNumbers(),
            EditorState.readOnly.of(true),
            gitDiffTheme,
          ],
        },
        b: {
          doc: resolvedDiff.modifiedContent,
          extensions: [
            lineNumbers(),
            EditorState.readOnly.of(true),
            gitDiffTheme,
          ],
        },
        parent: containerRef.current,
        highlightChanges: true,
        gutter: true,
      });
      mergeViewRef.current = mv;
    } else {
      const ev = new EditorView({
        state: EditorState.create({
          doc: resolvedDiff.modifiedContent,
          extensions: [
            lineNumbers(),
            EditorState.readOnly.of(true),
            gitDiffTheme,
            unifiedMergeView({
              original: resolvedDiff.originalContent,
              highlightChanges: true,
              gutter: true,
            }),
          ],
        }),
        parent: containerRef.current,
      });
      editorViewRef.current = ev;
    }

    return () => {
      mergeViewRef.current?.destroy();
      mergeViewRef.current = null;
      editorViewRef.current?.destroy();
      editorViewRef.current = null;
    };
  }, [resolvedDiff, viewMode]);

  const handleToggleStage = async () => {
    if (!resolvedDiff) return;
    if (resolvedDiff.staged) await unstagePaths([resolvedDiff.path]);
    else await stagePaths([resolvedDiff.path]);
    void refreshStatus();
  };

  const handlePull = async () => {
    await pull();
    void refreshStatus();
  };

  const handlePush = async () => {
    await push();
    void refreshStatus();
  };

  if (isLoadingDiff || (!resolvedDiff && !propDiff)) {
    return (
      <div className={styles["git-diff-viewer"]} data-testid="git-diff-viewer">
        <div className={styles["git-diff-viewer__loading"]}>
          Loading diff...
        </div>
      </div>
    );
  }

  const currentDiff = resolvedDiff || propDiff!;
  const segments = currentDiff.path.split("/");
  const fileName = segments[segments.length - 1];
  const dirSegments = segments.slice(0, segments.length - 1);
  const statusLabel = currentDiff.staged ? "Staged" : "Working Tree";

  return (
    <div className={styles["git-diff-viewer"]} data-testid="git-diff-viewer">
      <header className={styles["git-diff-viewer__header"]}>
        <div
          className={styles["git-diff-viewer__breadcrumbs"]}
          title={currentDiff.path}
        >
          <span
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              clip: "rect(0,0,0,0)",
            }}
          >
            {currentDiff.path}
          </span>
          {dirSegments.map((seg, i) => (
            <span
              key={`dir-${i}`}
              className={styles["git-diff-viewer__breadcrumb-segment"]}
            >
              <span>{seg}</span>
              <span className={styles["git-diff-viewer__breadcrumb-sep"]}>
                <CaretRight size={10} />
              </span>
            </span>
          ))}
          <span
            className={`${styles["git-diff-viewer__breadcrumb-segment"]} ${styles["git-diff-viewer__breadcrumb-segment--filename"]}`}
          >
            {fileName}
          </span>
          <span
            className={`${styles["git-diff-viewer__status-tag"]} ${
              currentDiff.staged
                ? styles["git-diff-viewer__status-tag--staged"]
                : ""
            }`}
            data-status={currentDiff.staged ? "staged" : "working"}
          >
            {statusLabel}
          </span>
        </div>

        <div className={styles["git-diff-viewer__actions"]}>
          <button
            type="button"
            className={styles["git-diff-viewer__toolbar-btn"]}
            onClick={() => void handlePull()}
            disabled={isSyncing}
            title="Pull"
            aria-label="Pull"
          >
            <ArrowDown
              size={14}
              className={isSyncing ? styles["spin"] : undefined}
            />
          </button>
          <button
            type="button"
            className={styles["git-diff-viewer__toolbar-btn"]}
            onClick={() => void handlePush()}
            disabled={isSyncing}
            title="Push"
            aria-label="Push"
          >
            <ArrowUp
              size={14}
              className={isSyncing ? styles["spin"] : undefined}
            />
          </button>
          <button
            type="button"
            className={styles["git-diff-viewer__toolbar-btn"]}
            onClick={() =>
              setViewMode(viewMode === "split" ? "inline" : "split")
            }
            title={
              viewMode === "split"
                ? "Switch to Unified Diff"
                : "Switch to Split Diff"
            }
            aria-label="Toggle split/inline diff"
          >
            {viewMode === "split" ? <Rows size={14} /> : <Columns size={14} />}
          </button>
          <button
            type="button"
            className={styles["git-diff-viewer__toolbar-btn"]}
            onClick={() => void handleToggleStage()}
            title={currentDiff.staged ? "Unstage" : "Stage"}
            aria-label={currentDiff.staged ? "Unstage" : "Stage"}
          >
            {currentDiff.staged ? <Minus size={14} /> : <Plus size={14} />}
          </button>
          {onClose && (
            <button
              type="button"
              className={styles["git-diff-viewer__toolbar-btn"]}
              onClick={onClose}
              title="Close diff"
              aria-label="Close diff"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      <div
        ref={containerRef}
        className={styles["git-diff-viewer__editor-container"]}
        data-testid="git-diff-editor-container"
      />
    </div>
  );
}
