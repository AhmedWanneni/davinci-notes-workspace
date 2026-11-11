import { useState } from "react";
import {
  Plus,
  Minus,
  ArrowCounterClockwise,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { Button } from "@app/design-system";
import type { GitFileChange } from "../types/gitTypes";
import { useGitManagerStore } from "../store/useGitManagerStore";
import { GitStatusRow } from "./GitStatusRow";
import { GitSectionGroup } from "./GitSectionGroup";
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
      <div className={styles["git-changes-empty"]}>
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
        <GitSectionGroup
          title="Merge Conflicts"
          count={conflicts.length}
          isOpen={isConflictsOpen}
          onToggle={() => setIsConflictsOpen(!isConflictsOpen)}
          isConflict
        >
          {conflicts.map((change) => (
            <GitStatusRow
              key={`conflict-${change.path}`}
              change={change}
              onClick={() => onSelectFile?.(change)}
            />
          ))}
        </GitSectionGroup>
      )}

      {staged.length > 0 && (
        <GitSectionGroup
          title="Staged Changes"
          count={staged.length}
          isOpen={isStagedOpen}
          onToggle={() => setIsStagedOpen(!isStagedOpen)}
          actions={
            <Button
              variant="ghost"
              size="sm"
              aria-label="Unstage All"
              title="Unstage All"
              disabled={isLoading}
              onClick={() => void unstagePaths([])}
            >
              <Minus size={12} />
            </Button>
          }
        >
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
        </GitSectionGroup>
      )}

      {unstaged.length > 0 && (
        <GitSectionGroup
          title="Changes"
          count={unstaged.length}
          isOpen={isUnstagedOpen}
          onToggle={() => setIsUnstagedOpen(!isUnstagedOpen)}
          actions={
            <>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Discard All"
                title="Discard All"
                disabled={isLoading}
                onClick={() => handleDiscard()}
              >
                <ArrowCounterClockwise size={12} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Stage All"
                title="Stage All"
                disabled={isLoading}
                onClick={() => void stagePaths([])}
              >
                <Plus size={12} />
              </Button>
            </>
          }
        >
          {unstaged.map((change) => (
            <GitStatusRow
              key={`unstaged-${change.path}`}
              change={change}
              onClick={() => onSelectFile?.(change)}
              actions={
                <div className={styles["git-row-actions"]}>
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
                </div>
              }
            />
          ))}
        </GitSectionGroup>
      )}
    </div>
  );
}
