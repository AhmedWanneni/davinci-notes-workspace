export interface FontTokens {
  readonly ui: string;
  readonly editor: string;
}

export interface TypeScaleTokens {
  readonly xs: string;
  readonly sm: string;
  readonly base: string;
  readonly lg: string;
  readonly xl: string;
  readonly "2xl": string;
}

export interface TypeWeightTokens {
  readonly regular: string;
  readonly medium: string;
  readonly semibold: string;
  readonly bold: string;
}

export interface TypeLeadingTokens {
  readonly tight: string;
  readonly normal: string;
  readonly relaxed: string;
}

export interface TypographyTokens {
  readonly font: FontTokens;
  readonly scale: TypeScaleTokens;
  readonly weight: TypeWeightTokens;
  readonly leading: TypeLeadingTokens;
}

export const fontTokens: FontTokens = {
  ui: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  editor:
    "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, 'Courier New', monospace",
} as const;

export const typeScaleTokens: TypeScaleTokens = {
  xs: "0.75rem",
  sm: "0.875rem",
  base: "1rem",
  lg: "1.25rem",
  xl: "1.5rem",
  "2xl": "2rem",
} as const;

export const typeWeightTokens: TypeWeightTokens = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const typeLeadingTokens: TypeLeadingTokens = {
  tight: "1.2",
  normal: "1.5",
  relaxed: "1.75",
} as const;

export const typographyTokens: TypographyTokens = {
  font: fontTokens,
  scale: typeScaleTokens,
  weight: typeWeightTokens,
  leading: typeLeadingTokens,
} as const;
