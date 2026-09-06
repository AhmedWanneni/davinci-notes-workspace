// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VersionHistoryPanel } from "./VersionHistoryPanel";

const gitHistory = vi.hoisted(() => ({
  versions: [
    { revision: "bbbbbbb", message: "Auto-save: note", timestamp: 2 },
    { revision: "aaaaaaa", message: "Auto-save: note", timestamp: 1 },
  ],
  readLocalGitVersion: vi.fn(async (_path: string, revision: string) =>
    revision === "bbbbbbb" ? "# Note\nsecond\n" : "# Note\nfirst\n",
  ),
  restoreLocalGitVersion: vi.fn(async () => "ccccccc"),
}));

vi.mock("../../git/localGitHistory", () => ({
  listLocalGitVersions: vi.fn(async () => gitHistory.versions),
  readLocalGitVersion: gitHistory.readLocalGitVersion,
  restoreLocalGitVersion: gitHistory.restoreLocalGitVersion,
}));

describe("VersionHistoryPanel", () => {
  it("renders the supplied local history and restores the selected content", async () => {
    const onRestored = vi.fn();
    render(
      <VersionHistoryPanel activePath="note.md" onRestored={onRestored} />,
    );

    expect(await screen.findAllByText("Auto-save: note")).toHaveLength(2);
    fireEvent.click(screen.getAllByText("Auto-save: note")[0]);
    await waitFor(() =>
      expect(gitHistory.readLocalGitVersion).toHaveBeenCalledTimes(2),
    );
    expect(screen.getByText("− first")).toBeTruthy();
    expect(screen.getByText("+ second")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "Restore this version" }),
    );
    await waitFor(() =>
      expect(gitHistory.restoreLocalGitVersion).toHaveBeenCalledWith(
        "note.md",
        "bbbbbbb",
      ),
    );
    expect(onRestored).toHaveBeenCalledWith("# Note\nsecond\n");
  });
});
