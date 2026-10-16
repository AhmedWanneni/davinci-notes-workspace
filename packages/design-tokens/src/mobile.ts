export interface MobileSafeAreaConstants {
  readonly headerHeight: number;
  readonly bottomBarHeight: number;
  readonly minMargin: number;
}

export interface MobilePressStateTokens {
  readonly hover: string;
  readonly active: string;
  readonly ripple: string;
  readonly overlay: string;
}

export interface MobileTokensNamespace {
  readonly minTouchTarget: number;
  readonly touchTargetSize: string;
  readonly safeArea: MobileSafeAreaConstants;
  readonly bodySize: string;
  readonly bodyLineHeight: string;
  readonly bottomSheetRadius: string;
  readonly bottomSheetRadiusNumber: number;
  readonly pressState: MobilePressStateTokens;
}

export const mobileTokens: MobileTokensNamespace = {
  minTouchTarget: 44,
  touchTargetSize: "44px",
  safeArea: {
    headerHeight: 44,
    bottomBarHeight: 48,
    minMargin: 16,
  },
  bodySize: "16px",
  bodyLineHeight: "1.4",
  bottomSheetRadius: "16px",
  bottomSheetRadiusNumber: 16,
  pressState: {
    hover: "rgba(0, 0, 0, 0.05)",
    active: "rgba(0, 0, 0, 0.08)",
    ripple: "rgba(127, 109, 242, 0.12)",
    overlay: "rgba(0, 0, 0, 0.08)",
  },
} as const;
