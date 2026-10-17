import React from "react";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import styles from "./SyncthingSyncCheckSection.module.scss";

export interface SyncthingCheckItemRowProps {
  title: string;
  passed: boolean;
  reason: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

export function SyncthingCheckItemRow({
  title,
  passed,
  reason,
  badge,
  children,
}: SyncthingCheckItemRowProps): React.JSX.Element {
  return (
    <div
      className={`${styles["sync-check-card__item"]} ${
        passed
          ? styles["sync-check-card__item--passed"]
          : styles["sync-check-card__item--failed"]
      }`}
    >
      <div className={styles["sync-check-card__item-header"]}>
        <div className={styles["sync-check-card__item-title-group"]}>
          {passed ? (
            <CheckCircle
              size={16}
              className={styles["sync-check-card__icon--passed"]}
            />
          ) : (
            <XCircle
              size={16}
              className={styles["sync-check-card__icon--failed"]}
            />
          )}
          {title}
        </div>
        {badge}
      </div>
      <p className={styles["sync-check-card__reason"]}>{reason}</p>
      {children}
    </div>
  );
}
