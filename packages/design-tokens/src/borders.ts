export interface BorderWidthTokens {
  readonly thin: string;
  readonly thick: string;
}

export const borderWidthTokens: BorderWidthTokens = {
  thin: "1px",
  thick: "2px",
} as const;
