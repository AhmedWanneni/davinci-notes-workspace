import { useEffect, useRef } from "react";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { unifiedMergeView } from "@codemirror/merge";
import { X, Plus, Minus } from "@phosphor-icons/react";
import { Button, Badge } from "@app/design-system";
import type { GitFileDiff } from "../types/gitTypes";
import { useGitManagerStore } from "../store/useGitManagerStore";
import styles from "./GitDiffViewer.module.scss";

export interface GitDiffViewerProps {
  diff: GitFileDiff;
  onClose?: () => void;
}

export function GitDiffViewer({ diff, onClose }: GitDiffViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const { stagePaths, unstagePaths, isLoading } = useGitManagerStore();

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy existing view before re-creating
    if (editorViewRef.current) {
      editorViewRef.current.destroy();
      editorViewRef.current = null;
    }

    const startState = EditorState.create({
      doc: diff.modifiedContent,
      extensions: [
        EditorState.readOnly.of(true),
        unifiedMergeView({
          original: diff.originalContent,
          highlightChanges: true,
          gutter: true,
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: containerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, [diff.originalContent, diff.modifiedContent]);

  const handleToggleStage = async () => {
    if (diff.staged) {
      await unstagePaths([diff.path]);
    } else {
      await stagePaths([diff.path]);
    }
  };

  return (
    <div className={styles["git-diff-viewer"]} data-testid="git-diff-viewer">
      <header className={styles["git-diff-viewer__header"]}>
        <div className={styles["git-diff-viewer__title-group"]}>
          <span className={styles["git-diff-viewer__path"]}>{diff.path}</span>
          <Badge variant={diff.staged ? "accent" : "muted"}>
            {diff.staged ? "Staged" : "Working Tree"}
          </Badge>
        </div>

        <div className={styles["git-diff-viewer__actions"]}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleToggleStage()}
            disabled={isLoading}
            title={diff.staged ? "Unstage changes" : "Stage changes"}
          >
            {diff.staged ? <Minus size={13} /> : <Plus size={13} />}
            <span>{diff.staged ? "Unstage" : "Stage"}</span>
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close diff"
            >
              <X size={14} />
            </Button>
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
