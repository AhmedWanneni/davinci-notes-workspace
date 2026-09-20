import React from "react";
import { Typography } from "@app/design-system";
import styles from "./SettingsDialog.module.scss";

export interface SettingsRowProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function SettingsRow({
  title,
  description,
  children,
  className = "",
}: SettingsRowProps) {
  return (
    <div className={`${styles["settings-row"]} ${className}`}>
      <div className={styles["settings-row-info"]}>
        <div className={styles["settings-row-title"]}>
          {typeof title === "string" ? (
            <Typography variant="text" size="sm" weight="medium">
              {title}
            </Typography>
          ) : (
            title
          )}
        </div>
        {description && (
          <div className={styles["settings-row-description"]}>
            {typeof description === "string" ? (
              <Typography variant="text" size="xs" color="muted">
                {description}
              </Typography>
            ) : (
              description
            )}
          </div>
        )}
      </div>
      {children && (
        <div className={styles["settings-row-control"]}>{children}</div>
      )}
    </div>
  );
}
