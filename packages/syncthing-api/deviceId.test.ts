import { describe, expect, it } from "vitest";
import {
  formatDeviceIdGroups,
  isValidDeviceIdFormat,
  normalizeDeviceId,
} from "./deviceId";

describe("deviceId utilities", () => {
  const rawId =
    "C4BPTD3-DOYDMY2-BMYU2JI-XZSA2JH-B7FJJTG-WEO6WA3-XGIYHVF-C2O5BQE";
  const cleanId = "C4BPTD3DOYDMY2BMYU2JIXZSA2JHB7FJJTGWEO6WA3XGIYHVFC2O5BQE";

  it("normalizes device ID by removing hyphens and spaces and making uppercase", () => {
    expect(normalizeDeviceId(rawId)).toBe(cleanId);
    expect(normalizeDeviceId("  c4bptd3-doydmy2  ")).toBe("C4BPTD3DOYDMY2");
  });

  it("validates 56-character alphanumeric device IDs", () => {
    expect(isValidDeviceIdFormat(rawId)).toBe(true);
    expect(isValidDeviceIdFormat(cleanId)).toBe(true);
    expect(isValidDeviceIdFormat("SHORT-ID")).toBe(false);
    expect(isValidDeviceIdFormat(rawId + "X")).toBe(false);
    expect(isValidDeviceIdFormat("INVALID_CHARS!-" + cleanId.slice(15))).toBe(
      false,
    );
  });

  it("formats normalized ID into 7-character groups", () => {
    expect(formatDeviceIdGroups(cleanId)).toBe(rawId);
    expect(formatDeviceIdGroups(rawId)).toBe(rawId);
    expect(formatDeviceIdGroups("ABCDEFG1234567")).toBe("ABCDEFG-1234567");
    expect(formatDeviceIdGroups("")).toBe("");
  });
});
