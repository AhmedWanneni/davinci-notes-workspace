import { type ColorTokens } from "./colors.js";
import { type BorderWidthTokens } from "./borders.js";
import { type BorderRadiusTokens } from "./radii.js";
import { type SpacingTokens } from "./spacing.js";
import { type TypographyTokens } from "./typography.js";
import { type ZIndexTokens } from "./zIndex.js";
import { type MotionTokens } from "./motion.js";
import { type IconTokens } from "./icons.js";
import { type EditorTokens } from "./editor.js";
import { type MobileTokensNamespace } from "./mobile.js";
export interface MobileTokens {
  readonly border: {
    readonly width: BorderWidthTokens;
    readonly radius: BorderRadiusTokens;
  };
  readonly color: ColorTokens;
  readonly lightColor: ColorTokens;
  readonly darkColor: ColorTokens;
  readonly space: SpacingTokens;
  readonly typography: TypographyTokens;
  readonly zIndex: ZIndexTokens;
  readonly motion: MotionTokens;
  readonly icon: IconTokens;
  readonly editor: EditorTokens;
  readonly mobile: MobileTokensNamespace;
}
export declare const fullMobileTokens: MobileTokens;
//# sourceMappingURL=mobileTheme.d.ts.map
