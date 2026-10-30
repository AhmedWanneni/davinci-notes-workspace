import { useState } from "react";
import {
  CaretDown,
  CaretRight,
  Plus,
  Minus,
  ArrowCounterClockwise,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { Button } from "@app/design-system";
import type { GitFileChange } from "../types/gitTypes";
import { useGitManagerStore } from "../store/useGitManagerStore";
import { GitStatusRow } from "./GitStatusRow";
import styles from "./GitChangesList.module.scss";

export interface GitChangesListProps {
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  conflicts: GitFileChange[];
  onSelectFile?: (change: GitFileChange) => void;
}

export function GitChangesList({
  staged,
  unstaged,
  conflicts,
  onSelectFile,
}: GitChangesListProps) {
  const [isConflictsOpen, setIsConflictsOpen] = useState(true);
  const [isStagedOpen, setIsStagedOpen] = useState(true);
  const [isUnstagedOpen, setIsUnstagedOpen] = useState(true);

  const { stagePaths, unstagePaths, discardPaths, isLoading } =
    useGitManagerStore();

  const hasAnyChanges =
    staged.length > 0 || unstaged.length > 0 || conflicts.length > 0;

  if (!hasAnyChanges) {
    return (
      <div
        style={{
          padding: "var(--space-4) var(--space-3)",
          color: "var(--color-text-subtle)",
          fontSize: "var(--type-scale-sm)",
        }}
      >
        No changes in working directory.
      </div>
    );
  }

  const handleDiscard = (path?: string) => {
    const label = path || "all files";
    if (
      window.confirm(
        `Are you sure you want to discard changes in ${label}? This action cannot be undone.`,
      )
    ) {
      void discardPaths(path ? [path] : []);
    }
  };

  return (
    <div className={styles["git-changes-list"]}>
      {conflicts.length > 0 && (
        <section
          className={`${styles["git-section"]} ${styles["git-section--conflicts"]}`}
        >
          <div
            className={styles["git-section__header"]}
            onClick={() => setIsConflictsOpen(!isConflictsOpen)}
            role="button"
            tabIndex={0}
          >
            <div className={styles["git-section__title"]}>
              {isConflictsOpen ? (
                <CaretDown size={12} />
              ) : (
                <CaretRight size={12} />
              )}
              <span>Merge Conflicts</span>
              <span className={styles["git-section__count"]}>
                {conflicts.length}
              </span>
            </div>
          </div>
          {isConflictsOpen && (
            <div className={styles["git-section__items"]}>
              {conflicts.map((change) => (
                <GitStatusRow
                  key={`conflict-${change.path}`}
                  change={change}
                  onClick={() => onSelectFile?.(change)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {staged.length > 0 && (
        <section className={styles["git-section"]}>
          <div className={styles["git-section__header"]}>
            <div
              className={styles["git-section__title"]}
              onClick={() => setIsStagedOpen(!isStagedOpen)}
              role="button"
              tabIndex={0}
            >
              {isStagedOpen ? (
                <CaretDown size={12} />
              ) : (
                <CaretRight size={12} />
              )}
              <span>Staged Changes</span>
              <span className={styles["git-section__count"]}>
                {staged.length}
              </span>
            </div>
            <div className={styles["git-section__actions"]}>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Unstage All"
                title="Unstage All"
                disabled={isLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  void unstagePaths([]);
                }}
              >
                <Minus size={12} />
              </Button>
            </div>
          </div>
          {isStagedOpen && (
            <div className={styles["git-section__items"]}>
              {staged.map((change) => (
                <GitStatusRow
                  key={`staged-${change.path}`}
                  change={change}
                  onClick={() => onSelectFile?.(change)}
                  actions={
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Unstage ${change.path}`}
                      title="Unstage"
                      disabled={isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        void unstagePaths([change.path]);
                      }}
                    >
                      <Minus size={12} />
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      {unstaged.length > 0 && (
        <section className={styles["git-section"]}>
          <div className={styles["git-section__header"]}>
            <div
              className={styles["git-section__title"]}
              onClick={() => setIsUnstagedOpen(!isUnstagedOpen)}
              role="button"
              tabIndex={0}
            >
              {isUnstagedOpen ? (
                <CaretDown size={12} />
              ) : (
                <CaretRight size={12} />
              )}
              <span>Changes</span>
              <span className={styles["git-section__count"]}>
                {unstaged.length}
              </span>
            </div>
            <div className={styles["git-section__actions"]}>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Discard All"
                title="Discard All"
                disabled={isLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDiscard();
                }}
              >
                <ArrowCounterClockwise size={12} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Stage All"
                title="Stage All"
                disabled={isLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  void stagePaths([]);
                }}
              >
                <Plus size={12} />
              </Button>
            </div>
          </div>
          {isUnstagedOpen && (
            <div className={styles["git-section__items"]}>
              {unstaged.map((change) => (
                <GitStatusRow
                  key={`unstaged-${change.path}`}
                  change={change}
                  onClick={() => onSelectFile?.(change)}
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Open diff for ${change.path}`}
                        title="Open Diff"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFile?.(change);
                        }}
                      >
                        <ArrowSquareOut size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Discard ${change.path}`}
                        title="Discard changes"
                        disabled={isLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDiscard(change.path);
                        }}
                      >
                        <ArrowCounterClockwise size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Stage ${change.path}`}
                        title="Stage changes"
                        disabled={isLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          void stagePaths([change.path]);
                        }}
                      >
                        <Plus size={12} />
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
