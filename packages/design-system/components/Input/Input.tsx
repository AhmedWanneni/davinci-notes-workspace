import React, { forwardRef } from "react";
import styles from "./Input.module.scss";

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size" | "prefix"
> {
  /**
   * Visually changes the input style, for example to indicate an error state.
   */
  variant?: "default" | "error";
  /**
   * The size of the input field.
   */
  size?: "sm" | "md" | "lg";
  /**
   * Optional prefix to render inside the input.
   */
  prefix?: React.ReactNode;
  /**
   * Optional suffix to render inside the input.
   */
  suffix?: React.ReactNode;
}

/**
 * Primitive text input component.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = "default",
      size = "md",
      prefix,
      suffix,
      className = "",
      ...props
    },
    ref,
  ) => {
    const wrapperClasses = [
      styles.wrapper,
      styles[`wrapper--${variant}`],
      styles[`wrapper--${size}`],
      props.disabled && styles["wrapper--disabled"],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={wrapperClasses}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <input ref={ref} className={styles.input} {...props} />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
    );
  },
);

Input.displayName = "Input";
