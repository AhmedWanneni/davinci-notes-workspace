import { useWindowDimensions } from "react-native";

export interface BreakpointState {
  width: number;
  height: number;
  isSmallPhone: boolean;
  isTablet: boolean;
  isLandscape: boolean;
}

export function useBreakpoint(): BreakpointState {
  const { width, height } = useWindowDimensions();

  const isSmallPhone = width < 380;
  const isTablet = width >= 600;
  const isLandscape = width > height;

  return {
    width,
    height,
    isSmallPhone,
    isTablet,
    isLandscape,
  };
}
