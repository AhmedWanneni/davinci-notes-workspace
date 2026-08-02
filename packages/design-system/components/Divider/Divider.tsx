import React, { forwardRef } from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import styles from "./Divider.module.scss";

export interface DividerProps extends React.ComponentPropsWithoutRef<
  typeof SeparatorPrimitive.Root
> {
  /**
   * Defines the visual importance of the divider.
   * - 'normal': Standard subtle border color.
   * - 'strong': Darker/more prominent border color.
   */
  variant?: "normal" | "strong";
}

/**
 * Primitive Divider (Separator) component built on top of Radix UI.
 * This is a first-class primitive given our border-based depth approach.
 */
export const Divider = forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  DividerProps
>(
  (
    {
      className = "",
      orientation = "horizontal",
      variant = "normal",
      ...props
    },
    ref,
  ) => {
    const classes = [
      styles.divider,
      styles[`divider--${orientation}`],
      styles[`divider--${variant}`],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <SeparatorPrimitive.Root
        ref={ref}
        className={classes}
        orientation={orientation}
        {...props}
      />
    );
  },
);
Divider.displayName = "Divider";
