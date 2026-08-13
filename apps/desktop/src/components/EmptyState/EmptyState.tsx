import React from "react";
import { Typography } from "@app/design-system";
import styles from "./EmptyState.module.scss";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description: string;
  action?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "md",
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${styles[size]}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        {title && (
          <Typography variant="h3" size={size === "lg" ? "lg" : "sm"}>
            {title}
          </Typography>
        )}
        <Typography
          variant="text"
          color="muted"
          size={size === "sm" ? "xs" : "sm"}
        >
          {description}
        </Typography>
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
