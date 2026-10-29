import { useState } from "react";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
import type { GitFileChange } from "../types/gitTypes";
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

  const hasAnyChanges =
    staged.length > 0 || unstaged.length > 0 || conflicts.length > 0;

  if (!hasAnyChanges) {
    return (
      <div style={{ padding: "var(--space-4) var(--space-3)", color: "var(--color-text-subtle)", fontSize: "var(--type-scale-sm)" }}>
        No changes in working directory.
      </div>
    );
  }

  return (
    <div className={styles["git-changes-list"]}>
      {conflicts.length > 0 && (
        <section className={`${styles["git-section"]} ${styles["git-section--conflicts"]}`}>
          <div
            className={styles["git-section__header"]}
            onClick={() => setIsConflictsOpen(!isConflictsOpen)}
            role="button"
            tabIndex={0}
          >
            <div className={styles["git-section__title"]}>
              {isConflictsOpen ? <CaretDown size={12} /> : <CaretRight size={12} />}
              <span>Merge Conflicts</span>
              <span className={styles["git-section__count"]}>{conflicts.length}</span>
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
          <div
            className={styles["git-section__header"]}
            onClick={() => setIsStagedOpen(!isStagedOpen)}
            role="button"
            tabIndex={0}
          >
            <div className={styles["git-section__title"]}>
              {isStagedOpen ? <CaretDown size={12} /> : <CaretRight size={12} />}
              <span>Staged Changes</span>
              <span className={styles["git-section__count"]}>{staged.length}</span>
            </div>
          </div>
          {isStagedOpen && (
            <div className={styles["git-section__items"]}>
              {staged.map((change) => (
                <GitStatusRow
                  key={`staged-${change.path}`}
                  change={change}
                  onClick={() => onSelectFile?.(change)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {unstaged.length > 0 && (
        <section className={styles["git-section"]}>
          <div
            className={styles["git-section__header"]}
            onClick={() => setIsUnstagedOpen(!isUnstagedOpen)}
            role="button"
            tabIndex={0}
          >
            <div className={styles["git-section__title"]}>
              {isUnstagedOpen ? <CaretDown size={12} /> : <CaretRight size={12} />}
              <span>Changes</span>
              <span className={styles["git-section__count"]}>{unstaged.length}</span>
            </div>
          </div>
          {isUnstagedOpen && (
            <div className={styles["git-section__items"]}>
              {unstaged.map((change) => (
                <GitStatusRow
                  key={`unstaged-${change.path}`}
                  change={change}
                  onClick={() => onSelectFile?.(change)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
