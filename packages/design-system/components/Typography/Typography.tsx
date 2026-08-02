import React, { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import styles from "./Typography.module.scss";

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * The HTML element or Radix Slot to render as.
   * If `asChild` is true, it will render as a Radix Slot and merge props into its child.
   * Otherwise, it will render the specified `as` element, defaulting to a sensible element based on variant.
   */
  asChild?: boolean;
  as?: React.ElementType;
  /**
   * The variant determines the base styles.
   */
  variant?: "h1" | "h2" | "h3" | "h4" | "text" | "editor";
  /**
   * The size scale of the typography. Defaults vary by variant.
   */
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  /**
   * Font weight. Defaults to regular for text, semibold/bold for headings.
   */
  weight?: "regular" | "medium" | "semibold" | "bold";
  /**
   * Color formatting.
   */
  color?: "normal" | "muted" | "faint" | "accent" | "error";
}

/**
 * Typography primitive for all text rendering in the app.
 * Follows a typography-led design system matching Obsidian's style.
 */
export const Typography = forwardRef<HTMLElement, TypographyProps>(
  (
    {
      asChild,
      as,
      variant = "text",
      size,
      weight,
      color,
      className = "",
      ...props
    },
    ref,
  ) => {
    const isHeading = variant.startsWith("h");
    const defaultElement: React.ElementType = isHeading
      ? (variant as "h1" | "h2" | "h3" | "h4")
      : "span";
    const Comp = asChild ? Slot : (as ?? defaultElement);

    const classes = [
      isHeading ? styles.heading : styles.text,
      isHeading && styles[`heading--${variant}`],
      variant === "editor" && styles["text--editor"],
      size && styles[`${isHeading ? "heading" : "text"}--${size}`],
      weight && styles[`${isHeading ? "heading" : "text"}--${weight}`],
      color && styles[`${isHeading ? "heading" : "text"}--${color}`],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <Comp ref={ref} className={classes} {...props} />;
  },
);

Typography.displayName = "Typography";
