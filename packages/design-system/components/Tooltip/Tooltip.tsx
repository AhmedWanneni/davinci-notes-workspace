import React, { forwardRef } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import styles from "./Tooltip.module.scss";

export interface TooltipProps extends React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Root
> {
  content: React.ReactNode;
  contentProps?: React.ComponentPropsWithoutRef<
    typeof TooltipPrimitive.Content
  >;
  children: React.ReactNode;
}

export const TooltipProvider = TooltipPrimitive.Provider;

/**
 * Primitive Tooltip component built on top of Radix UI.
 * Must be wrapped in a TooltipProvider at the app root, or locally if needed.
 */
export const Tooltip = forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipProps
>(({ children, content, contentProps, delayDuration = 300, ...props }, ref) => {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration} {...props}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          ref={ref}
          className={styles.tooltipContent}
          sideOffset={4}
          {...contentProps}
        >
          {content}
          <TooltipPrimitive.Arrow
            className={styles.tooltipArrow}
            width={11}
            height={5}
          />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
});

Tooltip.displayName = "Tooltip";
