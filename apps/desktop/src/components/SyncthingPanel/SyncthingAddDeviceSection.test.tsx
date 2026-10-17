// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  formatDeviceIdGroups,
  isValidDeviceIdFormat,
  SyncthingAddDeviceSection,
} from "./SyncthingAddDeviceSection";

describe("SyncthingAddDeviceSection", () => {
  it("validates 56-character formatted and unformatted device IDs", () => {
    const validRaw = "C4BPTD3DOYDMY2BMYU2JIXZSA2JHB7FJJTGWEO6WA3XGIYHVFC2O5BQE";
    const validHyphenated =
      "C4BPTD3-DOYDMY2-BMYU2JI-XZSA2JH-B7FJJTG-WEO6WA3-XGIYHVF-C2O5BQE";
    expect(isValidDeviceIdFormat(validRaw)).toBe(true);
    expect(isValidDeviceIdFormat(validHyphenated)).toBe(true);
    expect(isValidDeviceIdFormat("TOO-SHORT")).toBe(false);
  });

  it("formats raw ID into 8 groups of 7 characters", () => {
    const raw = "c4bptd3doydmy2bmyu2jixzsa2jhb7fjjtgweo6wa3xgiyhvfc2o5bqe";
    const formatted = formatDeviceIdGroups(raw);
    expect(formatted).toBe(
      "C4BPTD3-DOYDMY2-BMYU2JI-XZSA2JH-B7FJJTG-WEO6WA3-XGIYHVF-C2O5BQE",
    );
  });

  it("renders form fields and submit button", () => {
    const onAddedMock = vi.fn().mockResolvedValue(undefined);
    render(<SyncthingAddDeviceSection onAdded={onAddedMock} />);

    expect(screen.getByLabelText("Device ID")).toBeDefined();
    expect(screen.getByLabelText(/Device Name/)).toBeDefined();
    const btn = screen.getByLabelText("Add Device");
    expect(btn).toBeDefined();
    expect(btn.getAttribute("disabled")).not.toBeNull();
  });
});
