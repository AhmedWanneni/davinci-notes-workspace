import {
  Globe,
  MagnifyingGlass,
  Plus,
  UploadSimple,
} from "@phosphor-icons/react";
import styles from "./WebBookmarksDisplay.module.scss";

export interface WebBookmarksEmptyStateProps {
  isAllEmpty: boolean;
  onOpenImportModal: () => void;
  onOpenAddBar: () => void;
}

export function WebBookmarksEmptyState({
  isAllEmpty,
  onOpenImportModal,
  onOpenAddBar,
}: WebBookmarksEmptyStateProps) {
  if (isAllEmpty) {
    return (
      <div className={styles["wb-empty"]}>
        <div className={styles["wb-empty__icon"]}>
          <Globe size={32} weight="regular" />
        </div>
        <h2 className={styles["wb-empty__title"]}>No web bookmarks yet</h2>
        <p className={styles["wb-empty__desc"]}>
          Import bookmarks from Chrome, Firefox, or Brave, or add one manually.
        </p>
        <div className={styles["wb-empty__actions"]}>
          <button
            type="button"
            className={styles["wb-empty__btn-primary"]}
            onClick={onOpenImportModal}
          >
            <UploadSimple size={15} /> Import from Chrome / Firefox / Brave
          </button>
          <button
            type="button"
            className={styles["wb-empty__btn-secondary"]}
            onClick={onOpenAddBar}
          >
            <Plus size={15} /> Add Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["wb-empty"]}>
      <div className={styles["wb-empty__icon"]}>
        <MagnifyingGlass size={32} weight="regular" />
      </div>
      <h2 className={styles["wb-empty__title"]}>No bookmarks found</h2>
      <p className={styles["wb-empty__desc"]}>
        No links match your current search or filter.
      </p>
    </div>
  );
}
