import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { useDriveSyncStore } from "./useDriveSyncStore";

vi.mock("./desktopDriveAuth", () => ({
  fetchDriveAccountEmail: vi.fn(async () => "tester@gmail.com"),
  getDriveAccessToken: vi.fn(async () => "mock-token"),
  openDriveAuthorizationUrl: vi.fn(async () => {}),
  signInToDrive: vi.fn(async () => ({ accessToken: "mock-token" })),
  signOutOfDrive: vi.fn(async () => {}),
}));

vi.mock("./desktopSyncEngine", () => ({
  runDesktopDriveSync: vi.fn(async () => ({
    success: true,
    pushedCount: 2,
    pulledCount: 0,
  })),
}));

describe("useDriveSyncStore", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ vaultPath: "/mock/vault" });
    useDriveSyncStore.setState({
      isDriveSignedIn: false,
      driveAccountEmail: null,
      isSyncing: false,
      lastSyncedAt: null,
      syncError: null,
    });
  });

  it("checks auth status and populates account email", async () => {
    await useDriveSyncStore.getState().checkAuthStatus();
    expect(useDriveSyncStore.getState().isDriveSignedIn).toBe(true);
    expect(useDriveSyncStore.getState().driveAccountEmail).toBe("tester@gmail.com");
  });

  it("fails syncNow if no vault is currently open", async () => {
    useWorkspaceStore.setState({ vaultPath: null });
    const success = await useDriveSyncStore.getState().syncNow();
    expect(success).toBe(false);
    expect(useDriveSyncStore.getState().syncError).toContain("open a vault first");
  });

  it("performs syncNow and records lastSyncedAt when vault is open", async () => {
    const success = await useDriveSyncStore.getState().syncNow();
    expect(success).toBe(true);
    expect(useDriveSyncStore.getState().isSyncing).toBe(false);
    expect(useDriveSyncStore.getState().lastSyncedAt).toBeGreaterThan(0);
  });

  it("signs out cleanly", async () => {
    useDriveSyncStore.setState({ isDriveSignedIn: true, driveAccountEmail: "user@test.com" });
    await useDriveSyncStore.getState().signOut();
    expect(useDriveSyncStore.getState().isDriveSignedIn).toBe(false);
    expect(useDriveSyncStore.getState().driveAccountEmail).toBeNull();
  });
});
