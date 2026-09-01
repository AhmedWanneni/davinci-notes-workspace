// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { SyncConflictsPanel } from "./SyncConflictsPanel";

const { deleteNoteInVault } = vi.hoisted(() => ({
  deleteNoteInVault: vi.fn().mockResolvedValue({ ok: true, path: "" }),
}));

vi.mock("../../vault/deleteNoteInVault", () => ({
  deleteNoteInVault,
}));

describe("SyncConflictsPanel Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.setState({
      allNotePaths: [],
      openNotes: [],
    });
  });

  it("renders empty state when no conflict files exist", () => {
    render(<SyncConflictsPanel />);
    expect(screen.getByTestId("sync-conflicts-empty")).toBeDefined();
  });

  it("renders conflict file item list when conflicts are detected", () => {
    useWorkspaceStore.setState({
      allNotePaths: [
        "notes/regular.md",
        "notes/regular.sync-conflict-20260901-120000-DEVICE.md",
      ],
    });

    render(<SyncConflictsPanel />);
    expect(screen.getByTestId("sync-conflicts-panel")).toBeDefined();
    expect(screen.getByText("Sync Conflicts (1)")).toBeDefined();
    expect(
      screen.getByText("regular.sync-conflict-20260901-120000-DEVICE.md"),
    ).toBeDefined();
  });
});
