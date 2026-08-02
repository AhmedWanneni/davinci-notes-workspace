import React, { forwardRef } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "@phosphor-icons/react";
import styles from "./Checkbox.module.scss";

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {}

/**
 * Primitive Checkbox component built on top of Radix UI.
 */
export const Checkbox = forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className = "", ...props }, ref) => {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={`${styles.checkboxRoot} ${className}`}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={styles.checkboxIndicator}>
        <Check weight="bold" size={12} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

Checkbox.displayName = "Checkbox";
