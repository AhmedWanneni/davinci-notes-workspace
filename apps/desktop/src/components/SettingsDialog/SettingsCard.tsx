import React from "react";
import { Typography } from "@app/design-system";
import styles from "./SettingsDialog.module.scss";

export interface SettingsCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsCard({
  title,
  description,
  children,
  className = "",
}: SettingsCardProps) {
  return (
    <div className={`${styles["settings-card-wrapper"]} ${className}`}>
      {title && (
        <Typography
          variant="h3"
          size="sm"
          weight="semibold"
          className={styles["settings-card-title"]}
        >
          {title}
        </Typography>
      )}
      {description && (
        <Typography variant="text" size="xs" color="muted">
          {description}
        </Typography>
      )}
      <div className={styles["settings-card"]}>{children}</div>
    </div>
  );
}
