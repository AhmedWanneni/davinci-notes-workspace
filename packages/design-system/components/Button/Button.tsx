import React, { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import styles from "./Button.module.scss";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * If true, it renders as a Radix Slot, passing its props to its child.
   */
  asChild?: boolean;
  /**
   * The visual variant of the button.
   */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /**
   * The size of the button.
   */
  size?: "sm" | "md" | "lg" | "icon";
}

/**
 * Primitive button component.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { asChild, variant = "primary", size = "md", className = "", ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const classes = [
      styles.button,
      styles[`button--${variant}`],
      styles[`button--${size}`],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return <Comp ref={ref} className={classes} {...props} />;
  },
);

Button.displayName = "Button";
