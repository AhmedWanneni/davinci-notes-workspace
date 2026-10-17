// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SyncthingPendingSection } from "./SyncthingPendingSection";

describe("SyncthingPendingSection", () => {
  it("renders nothing when there are no pending devices or folders", () => {
    const { container } = render(
      <SyncthingPendingSection
        pendingDevices={[]}
        pendingFolders={[]}
        onUpdated={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders pending devices with Accept and Ignore actions", () => {
    render(
      <SyncthingPendingSection
        pendingDevices={[
          {
            deviceId:
              "DEV1-AAAAAAA-BBBBBBB-CCCCCCC-DDDDDDD-EEEEEEE-FFFFFFF-GGGGGGG",
            name: "Galaxy Phone",
            address: "10.0.0.5:22000",
            time: "2026-10-17T16:00:00Z",
          },
        ]}
        pendingFolders={[]}
        onUpdated={vi.fn()}
      />,
    );

    expect(screen.getByText("Incoming Requests")).toBeDefined();
    expect(screen.getByText("Galaxy Phone")).toBeDefined();
    expect(screen.getByLabelText(/Accept device Galaxy Phone/)).toBeDefined();
    expect(screen.getByLabelText(/Ignore device Galaxy Phone/)).toBeDefined();
  });
});
