import React, { forwardRef } from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import styles from "./Radio.module.scss";

export interface RadioGroupProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Root
> {}
export interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<
  typeof RadioGroupPrimitive.Item
> {}

/**
 * Primitive RadioGroup component built on top of Radix UI.
 */
export const RadioGroup = forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className = "", ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={`${styles.radioGroup} ${className}`}
      {...props}
    />
  );
});
RadioGroup.displayName = "RadioGroup";

/**
 * Primitive RadioGroupItem component built on top of Radix UI.
 */
export const RadioGroupItem = forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className = "", ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={`${styles.radioItem} ${className}`}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className={styles.radioIndicator} />
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = "RadioGroupItem";
