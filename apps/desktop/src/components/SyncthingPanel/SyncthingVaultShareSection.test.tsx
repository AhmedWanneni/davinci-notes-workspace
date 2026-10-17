// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SyncthingVaultShareSection } from "./SyncthingVaultShareSection";

describe("SyncthingVaultShareSection", () => {
  it("renders safety note explaining per-device state exclusions", () => {
    render(<SyncthingVaultShareSection onShared={vi.fn()} />);

    expect(screen.getByText("Share Active Vault")).toBeDefined();
    expect(screen.getByText("Automatic Per-Device Exclusion")).toBeDefined();
    expect(screen.getByText("vault-index.db*")).toBeDefined();
    expect(screen.getByText(".stignore")).toBeDefined();
    expect(
      screen.getByLabelText("Remote Device ID to share with:"),
    ).toBeDefined();
    const btn = screen.getByLabelText("Share vault with device");
    expect(btn).toBeDefined();
    expect(btn.getAttribute("disabled")).not.toBeNull();
  });
});
