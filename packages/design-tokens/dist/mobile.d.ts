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
export declare const mobileTokens: MobileTokensNamespace;
//# sourceMappingURL=mobile.d.ts.map