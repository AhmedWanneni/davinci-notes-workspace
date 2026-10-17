// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SyncthingSyncCheckSection } from "./SyncthingSyncCheckSection";
import type { SyncthingCheckReport } from "./syncthingCommands";

const mockReportAllPass: SyncthingCheckReport = {
  reachability: {
    passed: true,
    reason: "Syncthing v2.1.6 reachable at 127.0.0.1:8384",
  },
  remoteConnected: {
    passed: true,
    reason: "1 remote device(s) connected",
    connectedDevices: ["6IAWYVY-TEST"],
  },
  folderState: {
    passed: true,
    reason: "Folder is idle (0 out-of-sync items)",
    folderId: "test-vault",
    state: "idle",
    outOfSyncItems: 0,
    remoteCompletions: { "6IAWYVY-TEST": 100 },
  },
  folderErrors: {
    passed: true,
    reason: "No folder errors reported",
    errors: [],
  },
  selfTest: {
    passed: true,
    reason: "Synced to remote in 340ms",
    roundTripMs: 340,
  },
};

const mockReportOffline: SyncthingCheckReport = {
  reachability: {
    passed: true,
    reason: "Syncthing v2.1.6 reachable at 127.0.0.1:8384",
  },
  remoteConnected: {
    passed: false,
    reason: "No remote devices connected",
    connectedDevices: [],
  },
  folderState: {
    passed: true,
    reason: "Folder is idle (0 out-of-sync items)",
    folderId: "test-vault",
    state: "idle",
    outOfSyncItems: 0,
    remoteCompletions: {},
  },
  folderErrors: {
    passed: true,
    reason: "No folder errors reported",
    errors: [],
  },
  selfTest: {
    passed: false,
    reason: "Skipped: no remote devices connected to verify sync round-trip",
    roundTripMs: null,
  },
};

describe("SyncthingSyncCheckSection", () => {
  it("renders check sync trigger button", () => {
    render(<SyncthingSyncCheckSection />);
    expect(screen.getByRole("button", { name: /Check sync/i })).toBeDefined();
  });

  it("renders 5 checks with pass details when report provided", () => {
    render(<SyncthingSyncCheckSection customReport={mockReportAllPass} />);
    expect(screen.getByText(/1\. Syncthing API Reachability/i)).toBeDefined();
    expect(screen.getByText(/2\. Remote Device Connectivity/i)).toBeDefined();
    expect(screen.getByText(/3\. Vault Folder Sync State/i)).toBeDefined();
    expect(screen.getByText(/4\. Folder API Error Diagnostic/i)).toBeDefined();
    expect(screen.getByText(/5\. Round-Trip Sync Self-Test/i)).toBeDefined();
    expect(screen.getByText("Synced to remote in 340ms")).toBeDefined();
  });

  it("renders clear offline reason when remote is disconnected", () => {
    render(<SyncthingSyncCheckSection customReport={mockReportOffline} />);
    expect(screen.getByText("No remote devices connected")).toBeDefined();
    expect(
      screen.getByText(
        "Skipped: no remote devices connected to verify sync round-trip",
      ),
    ).toBeDefined();
  });
});
