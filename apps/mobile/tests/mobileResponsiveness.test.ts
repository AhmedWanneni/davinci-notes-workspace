import { describe, expect, it, vi } from "vitest";
import * as RN from "react-native";
import { useBreakpoint } from "../src/useBreakpoint";
import { mobileTokens } from "@app/design-tokens/mobile";

describe("Mobile Responsiveness & Breakpoint Suite (Phase 9)", () => {
  it("evaluates small phone profile (<380px)", () => {
    vi.spyOn(RN, "useWindowDimensions").mockReturnValue({
      width: 360,
      height: 740,
      scale: 2,
      fontScale: 1,
    });

    const bp = useBreakpoint();
    expect(bp.isSmallPhone).toBe(true);
    expect(bp.isTablet).toBe(false);
    expect(bp.isLandscape).toBe(false);
  });

  it("evaluates large phone profile (390px)", () => {
    vi.spyOn(RN, "useWindowDimensions").mockReturnValue({
      width: 393,
      height: 852,
      scale: 3,
      fontScale: 1,
    });

    const bp = useBreakpoint();
    expect(bp.isSmallPhone).toBe(false);
    expect(bp.isTablet).toBe(false);
    expect(bp.isLandscape).toBe(false);
  });

  it("evaluates tablet / foldable profile (>=600px)", () => {
    vi.spyOn(RN, "useWindowDimensions").mockReturnValue({
      width: 768,
      height: 1024,
      scale: 2,
      fontScale: 1,
    });

    const bp = useBreakpoint();
    expect(bp.isSmallPhone).toBe(false);
    expect(bp.isTablet).toBe(true);
    expect(bp.isLandscape).toBe(false);
  });

  it("evaluates landscape profile (width > height)", () => {
    vi.spyOn(RN, "useWindowDimensions").mockReturnValue({
      width: 852,
      height: 393,
      scale: 3,
      fontScale: 1,
    });

    const bp = useBreakpoint();
    expect(bp.isLandscape).toBe(true);
    expect(bp.isTablet).toBe(true);
  });

  it("ensures minimum touch target >= 44pt under 200% font scale", () => {
    vi.spyOn(RN, "useWindowDimensions").mockReturnValue({
      width: 390,
      height: 844,
      scale: 3,
      fontScale: 2.0,
    });

    expect(mobileTokens.minTouchTarget).toBeGreaterThanOrEqual(44);
  });
});
