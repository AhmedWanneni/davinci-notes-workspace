// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SyncStatusButton } from "./SyncStatusButton";

afterEach(() => {
  cleanup();
});

describe("SyncStatusButton", () => {
  it("renders synced state as icon only without text and triggers sync on click", () => {
    const onSyncNow = vi.fn();
    render(
      <SyncStatusButton
        syncMode="drive"
        isDriveSignedIn={true}
        isDriveSyncing={false}
        syncError={null}
        onSyncNow={onSyncNow}
      />,
    );

    const btn = screen.getByTestId("sync-status-button");
    expect(btn.getAttribute("data-state")).toBe("synced");
    expect(btn.getAttribute("title")).toContain("Synced");
    expect(btn.textContent).toBe(""); // strictly icon only, no text label

    fireEvent.click(btn);
    expect(onSyncNow).toHaveBeenCalledOnce();
  });

  it("renders syncing state with disabled button and spinner", () => {
    const onSyncNow = vi.fn();
    render(
      <SyncStatusButton
        syncMode="drive"
        isDriveSignedIn={true}
        isDriveSyncing={true}
        onSyncNow={onSyncNow}
      />,
    );

    const btn = screen.getByTestId("sync-status-button");
    expect(btn.getAttribute("data-state")).toBe("syncing");
    expect(btn.hasAttribute("disabled")).toBe(true);

    fireEvent.click(btn);
    expect(onSyncNow).not.toHaveBeenCalled();
  });

  it("renders error state and opens sync settings on click", () => {
    const onOpenSettings = vi.fn();
    render(
      <SyncStatusButton
        syncMode="drive"
        isDriveSignedIn={true}
        isDriveSyncing={false}
        syncError="Rate limit exceeded"
        onOpenSyncSettings={onOpenSettings}
      />,
    );

    const btn = screen.getByTestId("sync-status-button");
    expect(btn.getAttribute("data-state")).toBe("error");
    expect(btn.getAttribute("title")).toContain("Rate limit exceeded");

    fireEvent.click(btn);
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it("renders disconnected state when signed out", () => {
    const onOpenSettings = vi.fn();
    render(
      <SyncStatusButton
        syncMode="drive"
        isDriveSignedIn={false}
        isDriveSyncing={false}
        onOpenSyncSettings={onOpenSettings}
      />,
    );

    const btn = screen.getByTestId("sync-status-button");
    expect(btn.getAttribute("data-state")).toBe("disconnected");

    fireEvent.click(btn);
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });
});
