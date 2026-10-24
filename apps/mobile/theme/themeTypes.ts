import type { ColorTokens } from "@app/design-tokens";
import type { BorderRadiusTokens } from "@app/design-tokens";
import type { BorderWidthTokens } from "@app/design-tokens";
import type { SpacingTokens } from "@app/design-tokens";
import type { TypographyTokens } from "@app/design-tokens";
import type { IconSizeTokens } from "@app/design-tokens";

export interface MobileLayoutTokens {
  readonly capsuleRadius: string;
  readonly sheetGroupRadius: string;
  readonly touchTarget: number;
}

export interface NativeThemeTokens {
  readonly id: string;
  readonly name: string;
  readonly isDark: boolean;
  readonly color: ColorTokens;
  readonly radius: BorderRadiusTokens;
  readonly borderWidth: BorderWidthTokens;
  readonly space: SpacingTokens;
  readonly typography: TypographyTokens;
  readonly iconSize: IconSizeTokens;
  readonly layout: MobileLayoutTokens;
}
