import type { ImgHTMLAttributes } from "react";
import styles from "./OwlIcon.module.scss";

export interface OwlIconProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  size?: number;
  variant?: "dark" | "light";
}

export function OwlIcon({
  size = 18,
  variant = "dark",
  className,
  alt = "Sophia owl",
  ...props
}: OwlIconProps) {
  const src = variant === "light" ? "/logo/light.logo.svg" : "/logo/dark-logo.svg";
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`${styles["owl-icon"]} ${className || ""}`}
      {...props}
    />
  );
}
