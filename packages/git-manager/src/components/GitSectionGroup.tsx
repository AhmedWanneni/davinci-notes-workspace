import type { ReactNode } from "react";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
import styles from "./GitChangesList.module.scss";

export interface GitSectionGroupProps {
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  isConflict?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}

export function GitSectionGroup({
  title,
  count,
  isOpen,
  onToggle,
  isConflict,
  actions,
  children,
}: GitSectionGroupProps) {
  const rootClass = isConflict
    ? `${styles["git-section"]} ${styles["git-section--conflicts"]}`
    : styles["git-section"];

  return (
    <section className={rootClass}>
      <div
        className={styles["git-section__header"]}
        onClick={onToggle}
        role="button"
        tabIndex={0}
      >
        <div className={styles["git-section__title"]}>
          {isOpen ? <CaretDown size={12} /> : <CaretRight size={12} />}
          <span>{title}</span>
        </div>
        <div className={styles["git-section__trailing"]}>
          {actions && (
            <div
              className={styles["git-section__actions"]}
              onClick={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}
          <span className={styles["git-section__count"]}>{count}</span>
        </div>
      </div>
      {isOpen && <div className={styles["git-section__items"]}>{children}</div>}
    </section>
  );
}
