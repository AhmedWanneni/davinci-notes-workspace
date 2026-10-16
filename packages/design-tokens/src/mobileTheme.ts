import { colorTokens, type ColorTokens } from "./colors.js";
import { borderWidthTokens, type BorderWidthTokens } from "./borders.js";
import { borderRadiusTokens, type BorderRadiusTokens } from "./radii.js";
import { spacingTokens, type SpacingTokens } from "./spacing.js";
import { typographyTokens, type TypographyTokens } from "./typography.js";
import { zIndexTokens, type ZIndexTokens } from "./zIndex.js";
import { motionTokens, type MotionTokens } from "./motion.js";
import { iconTokens, type IconTokens } from "./icons.js";
import { editorTokens, type EditorTokens } from "./editor.js";
import { mobileTokens, type MobileTokensNamespace } from "./mobile.js";

export interface MobileTokens {
  readonly border: {
    readonly width: BorderWidthTokens;
    readonly radius: BorderRadiusTokens;
  };
  readonly color: ColorTokens;
  readonly space: SpacingTokens;
  readonly typography: TypographyTokens;
  readonly zIndex: ZIndexTokens;
  readonly motion: MotionTokens;
  readonly icon: IconTokens;
  readonly editor: EditorTokens;
  readonly mobile: MobileTokensNamespace;
}

export const fullMobileTokens: MobileTokens = {
  border: {
    width: borderWidthTokens,
    radius: borderRadiusTokens,
  },
  color: colorTokens,
  space: spacingTokens,
  typography: typographyTokens,
  zIndex: zIndexTokens,
  motion: motionTokens,
  icon: iconTokens,
  editor: editorTokens,
  mobile: mobileTokens,
} as const;
