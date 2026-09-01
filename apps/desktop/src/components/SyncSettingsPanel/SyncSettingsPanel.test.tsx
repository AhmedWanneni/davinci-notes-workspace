// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SyncSettingsPanel } from "./SyncSettingsPanel";

describe("SyncSettingsPanel Component", () => {
  it("renders asymmetric mode options when mode is off", () => {
    const onSelectMode = vi.fn();
    render(<SyncSettingsPanel mode="off" onSelectMode={onSelectMode} />);

    expect(screen.getByTestId("sync-option-drive")).toBeDefined();
    expect(screen.getByTestId("sync-option-folder")).toBeDefined();

    // Drive option displays Recommended badge
    expect(screen.getByText("Recommended")).toBeDefined();

    fireEvent.click(screen.getByText("Enable & Sign in to Google Drive"));
    expect(onSelectMode).toHaveBeenCalledWith("drive");
  });

  it("renders drive connected state and action handlers", () => {
    const onDriveSyncNow = vi.fn();
    const onDriveSignOut = vi.fn();
    const onSelectMode = vi.fn();

    render(
      <SyncSettingsPanel
        mode="drive"
        isDriveSignedIn={true}
        driveAccountEmail="leonardo@davinci.app"
        onSelectMode={onSelectMode}
        onDriveSyncNow={onDriveSyncNow}
        onDriveSignOut={onDriveSignOut}
      />,
    );

    expect(screen.getByText("Google Drive Sync Active")).toBeDefined();
    expect(screen.getByText("Account: leonardo@davinci.app")).toBeDefined();
    expect(screen.getByText("Connected")).toBeDefined();

    fireEvent.click(screen.getByText("Sync Now"));
    expect(onDriveSyncNow).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Disconnect Drive"));
    expect(onDriveSignOut).toHaveBeenCalled();
    expect(onSelectMode).toHaveBeenCalledWith("off");
  });

  it("renders folder mode state and open conflicts action", () => {
    const onOpenConflictsPanel = vi.fn();
    render(
      <SyncSettingsPanel
        mode="folder"
        vaultPath="/vaults/davinci"
        onSelectMode={vi.fn()}
        onOpenConflictsPanel={onOpenConflictsPanel}
      />,
    );

    expect(screen.getByText("Folder Sync Mode Active")).toBeDefined();
    expect(screen.getByText("Vault Path: /vaults/davinci")).toBeDefined();

    fireEvent.click(screen.getByText("View Sync Conflicts"));
    expect(onOpenConflictsPanel).toHaveBeenCalled();
  });
});
