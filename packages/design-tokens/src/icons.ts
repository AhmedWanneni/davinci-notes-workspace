export interface IconSizeTokens {
  readonly xs: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
}

export interface IconWeightTokens {
  readonly default: string;
  readonly active: string;
}

export interface IconTokens {
  readonly size: IconSizeTokens;
  readonly weight: IconWeightTokens;
}

export const iconSizeTokens: IconSizeTokens = {
  xs: "12px",
  sm: "14px",
  md: "16px",
  lg: "20px",
  xl: "24px",
} as const;

export const iconWeightTokens: IconWeightTokens = {
  default: "regular",
  active: "fill",
} as const;

export const iconTokens: IconTokens = {
  size: iconSizeTokens,
  weight: iconWeightTokens,
} as const;
