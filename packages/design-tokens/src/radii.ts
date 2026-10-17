export interface BorderRadiusTokens {
  readonly none: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
}

export const borderRadiusTokens: BorderRadiusTokens = {
  none: "0px",
  sm: "2px",
  md: "4px",
  lg: "6px",
  xl: "1rem",
} as const;
