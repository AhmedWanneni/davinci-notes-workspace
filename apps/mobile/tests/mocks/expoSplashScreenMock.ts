import { vi } from "vitest";

export const preventAutoHideAsync = vi.fn().mockResolvedValue(true);
export const hideAsync = vi.fn().mockResolvedValue(true);

export default {
  preventAutoHideAsync,
  hideAsync,
};
