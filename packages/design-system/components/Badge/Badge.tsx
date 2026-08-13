import React, { forwardRef } from "react";
import styles from "./Badge.module.scss";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * The visual variant of the badge.
   */
  variant?: "neutral" | "accent" | "success" | "warning" | "error";
  /**
   * Optional icon to render inside the badge.
   */
  icon?: React.ReactNode;
}

/**
 * Primitive Badge component for small status indicators or tags.
 * Designed without pill styling (as per design principles, uses border-radius-sm/md).
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "neutral", icon, className = "", children, ...props }, ref) => {
    const classes = [styles.badge, styles[`badge--${variant}`], className]
      .filter(Boolean)
      .join(" ");

    return (
      <span ref={ref} className={classes} {...props}>
        {icon && (
          <span className={styles["icon-wrapper"] || styles.iconWrapper}>
            {icon}
          </span>
        )}
        {children}
      </span>
    );
  },
);
Badge.displayName = "Badge";
