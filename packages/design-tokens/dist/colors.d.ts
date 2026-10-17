export interface ColorBgTokens {
  readonly primary: string;
  readonly "primary-alt": string;
  readonly secondary: string;
  readonly "secondary-alt": string;
  readonly scrim: string;
  readonly "status-accent": string;
  readonly "status-success": string;
  readonly "status-warning": string;
  readonly "status-error": string;
  readonly hover: string;
  readonly active: string;
}
export interface ColorTextTokens {
  readonly normal: string;
  readonly muted: string;
  readonly faint: string;
  readonly accent: string;
  readonly "on-accent": string;
  readonly error: string;
  readonly success: string;
  readonly warning: string;
}
export interface ColorBorderTokens {
  readonly subtle: string;
  readonly normal: string;
  readonly focus: string;
  readonly "status-accent": string;
  readonly "status-success": string;
  readonly "status-warning": string;
  readonly "status-error": string;
}
export interface ColorInteractiveTokens {
  readonly accent: string;
  readonly "accent-hover": string;
  readonly "accent-active": string;
}
export interface ColorTokens {
  readonly bg: ColorBgTokens;
  readonly text: ColorTextTokens;
  readonly border: ColorBorderTokens;
  readonly interactive: ColorInteractiveTokens;
  readonly shadow: string;
}
export declare const colorTokens: ColorTokens;
export declare const darkColorTokens: ColorTokens;
//# sourceMappingURL=colors.d.ts.map
