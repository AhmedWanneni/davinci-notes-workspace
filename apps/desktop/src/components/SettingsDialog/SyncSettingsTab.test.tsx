// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SyncSettingsTab } from "./SyncSettingsTab";

vi.mock("../SyncthingPanel", () => ({
  default: () => <div>Syncthing panel content</div>,
}));

describe("SyncSettingsTab", () => {
  it("shows only the selected provider content", async () => {
    render(<SyncSettingsTab syncMode="off" vaultPath="/vault" />);

    expect(screen.queryByText("Sync via Folder Tool (Syncthing, etc.)")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Syncthing" }));
    expect(await screen.findByText("Syncthing panel content")).toBeDefined();
    expect(screen.queryByText("Sync via Google Drive")).toBeNull();
    expect(screen.queryByText("Google Drive Sync Active")).toBeNull();
  });

  it("keeps Drive tab selected when Drive mode becomes active", () => {
    const { rerender } = render(<SyncSettingsTab syncMode="off" vaultPath="/vault" />);
    rerender(<SyncSettingsTab syncMode="drive" vaultPath="/vault" />);

    expect(screen.getByRole("tab", { name: "Drive" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("button", { name: "Sign In to Google Drive" })).toBeDefined();
    expect(screen.queryByText("Syncthing panel content")).toBeNull();
  });
});
