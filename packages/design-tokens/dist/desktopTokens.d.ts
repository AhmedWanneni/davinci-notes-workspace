import { type BorderWidthTokens } from "./borders.js";
import { type BorderRadiusTokens } from "./radii.js";
import { type ColorTokens } from "./colors.js";
import { type SpacingTokens } from "./spacing.js";
import { type TypographyTokens } from "./typography.js";
import { type ZIndexTokens } from "./zIndex.js";
import { type MotionTokens } from "./motion.js";
import { type IconTokens } from "./icons.js";
import { type EditorTokens } from "./editor.js";
export interface DesktopTokens {
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
}
export declare const desktopTokens: DesktopTokens;
//# sourceMappingURL=desktopTokens.d.ts.map
