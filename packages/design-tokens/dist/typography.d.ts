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
export declare const fontTokens: FontTokens;
export declare const typeScaleTokens: TypeScaleTokens;
export declare const typeWeightTokens: TypeWeightTokens;
export declare const typeLeadingTokens: TypeLeadingTokens;
export declare const typographyTokens: TypographyTokens;
//# sourceMappingURL=typography.d.ts.map
