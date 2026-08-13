import React from "react";
import { Typography } from "@app/design-system";

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
    <div className="empty-state" data-size={size}>
      {icon && <div className="empty-state__icon">{icon}</div>}
      <div className="empty-state__content">
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
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
