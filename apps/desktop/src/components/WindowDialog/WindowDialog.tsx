import React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import styles from "./WindowDialog.module.scss";

export type WindowDialogSize = "sm" | "md" | "lg" | "xl" | "auto";

export interface WindowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Custom header to completely override the default 44px macOS window header */
  header?: React.ReactNode;
  /** Right side elements in the header; defaults to 60px spacer */
  headerRight?: React.ReactNode;
  hideTrafficLights?: boolean;
  size?: WindowDialogSize;
  width?: string | number;
  maxHeight?: string | number;
  position?: "center" | "top";
  className?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  ariaLabel?: string;
  closeAriaLabel?: string;
}

export function WindowDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  header,
  headerRight,
  hideTrafficLights = false,
  size = "md",
  width,
  maxHeight,
  position = "center",
  className = "",
  bodyClassName = "",
  footer,
  children,
  ariaLabel,
  closeAriaLabel,
}: WindowDialogProps) {
  const rootClasses = [
    styles["dialog-root"],
    styles[`dialog-root--size-${size}`],
    styles[`dialog-root--position-${position}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const rootStyle: React.CSSProperties = {
    ...(width ? { width } : {}),
    ...(maxHeight ? { maxHeight } : {}),
  };

  const computedAriaLabel =
    ariaLabel || (typeof title === "string" ? title : "Dialog");
  const computedCloseLabel =
    closeAriaLabel ||
    (ariaLabel ? `Close ${ariaLabel.toLowerCase()}` : "Close dialog");

  return (
    <DialogPrimitive.Root
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles["dialog-overlay"]} />
        <DialogPrimitive.Content
          className={rootClasses}
          style={rootStyle}
          aria-label={computedAriaLabel}
        >
          {header ? (
            header
          ) : (
            <div className={styles["window-header"]}>
              {!hideTrafficLights ? (
                <div className={styles["traffic-lights"]}>
                  <button
                    type="button"
                    className={`${styles["traffic-dot"]} ${styles["traffic-dot--close"]}`}
                    onClick={onClose}
                    aria-label={computedCloseLabel}
                  />
                  <span
                    className={`${styles["traffic-dot"]} ${styles["traffic-dot--minimize"]}`}
                  />
                  <span
                    className={`${styles["traffic-dot"]} ${styles["traffic-dot--maximize"]}`}
                  />
                </div>
              ) : (
                <div style={{ width: 14 }} />
              )}

              <div className={styles["window-title-wrap"]}>
                {title && (
                  <DialogPrimitive.Title className={styles["window-title"]}>
                    {title}
                  </DialogPrimitive.Title>
                )}
                {subtitle && (
                  <div className={styles["window-subtitle"]}>{subtitle}</div>
                )}
              </div>

              <div className={styles["header-right"]}>{headerRight}</div>
            </div>
          )}

          <div
            className={`${styles["dialog-body"]} ${bodyClassName}`.trim()}
          >
            {children}
          </div>

          {footer && (
            <div className={styles["dialog-footer"]}>{footer}</div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
