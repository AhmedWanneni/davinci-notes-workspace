import React, { forwardRef } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import styles from "./Toggle.module.scss";

export interface ToggleProps extends React.ComponentPropsWithoutRef<
  typeof SwitchPrimitive.Root
> {}

/**
 * Primitive Toggle/Switch component built on top of Radix UI.
 */
export const Toggle = forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  ToggleProps
>(({ className = "", ...props }, ref) => {
  return (
    <SwitchPrimitive.Root
      ref={ref}
      className={`${styles.toggleRoot} ${className}`}
      {...props}
    >
      <SwitchPrimitive.Thumb className={styles.toggleThumb} />
    </SwitchPrimitive.Root>
  );
});
Toggle.displayName = "Toggle";
