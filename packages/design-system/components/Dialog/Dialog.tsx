import React, { forwardRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react";
import styles from "./Dialog.module.scss";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export interface DialogContentProps extends Omit<
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  "title"
> {
  /**
   * Title of the dialog for accessibility.
   */
  title?: React.ReactNode;
  /**
   * Description of the dialog for accessibility.
   */
  description?: React.ReactNode;
  /**
   * Whether to show the default close button in the top right.
   */
  showCloseButton?: boolean;
}

/**
 * Primitive Dialog Content component built on top of Radix UI.
 */
export const DialogContent = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(
  (
    {
      className = "",
      children,
      title,
      description,
      showCloseButton = true,
      ...props
    },
    ref,
  ) => {
    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.dialogOverlay} />
        <DialogPrimitive.Content
          ref={ref}
          className={`${styles.dialogContent || styles["dialog-content"]} ${className}`}
          {...props}
        >
          {(title || description) && (
            <div className={styles.dialogHeader}>
              {title && (
                <DialogPrimitive.Title className={styles.dialogTitle}>
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description
                  className={styles.dialogDescription}
                >
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
          )}

          <div className={styles.dialogBody}>{children}</div>

          {showCloseButton && (
            <DialogPrimitive.Close
              className={styles.dialogClose}
              aria-label="Close"
            >
              <X size={16} />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  },
);
DialogContent.displayName = "DialogContent";
