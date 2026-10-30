import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GitConflictResolver } from "./GitConflictResolver";
import { useGitConflictStore } from "../store/useGitConflictStore";
import { useGitManagerStore } from "../store/useGitManagerStore";

vi.mock("../api/gitClient", () => ({
  getGitConflictDetails: vi.fn(),
  resolveGitConflict: vi.fn().mockResolvedValue(undefined),
  abortGitMerge: vi.fn().mockResolvedValue(undefined),
  continueGitMerge: vi.fn().mockResolvedValue("new-merge-hash"),
}));

describe("GitConflictResolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGitManagerStore.setState({
      repoInfo: {
        gitAvailable: true,
        isRepo: true,
        branch: "main",
        isEmpty: false,
        isDetached: false,
      },
    });
    useGitConflictStore.setState({
      activeConflict: {
        path: "notes/conflict.md",
        base: "Original base line\n",
        ours: "Ours modification\n",
        theirs: "Theirs modification\n",
        current: "<<<<<<< HEAD\nOurs modification\n=======\nTheirs modification\n>>>>>>> feature\n",
        isBinary: false,
        oursExists: true,
        theirsExists: true,
      },
      activeResult: "<<<<<<< HEAD\nOurs modification\n=======\nTheirs modification\n>>>>>>> feature\n",
      isResolving: false,
      conflictError: null,
    });
  });

  it("renders 3 panes and path correctly", () => {
    render(<GitConflictResolver />);
    expect(screen.getByText("notes/conflict.md")).toBeDefined();
    expect(screen.getByText("Ours (Current Branch)")).toBeDefined();
    expect(screen.getByText("Result (Resolved Output)")).toBeDefined();
    expect(screen.getByText("Theirs (Incoming Changes)")).toBeDefined();
    expect(screen.getByText("Ours modification")).toBeDefined();
    expect(screen.getByText("Theirs modification")).toBeDefined();
  });

  it("accepts ours into result pane", () => {
    render(<GitConflictResolver />);
    const oursBtn = screen.getByRole("button", { name: /ours/i });
    fireEvent.click(oursBtn);

    const textarea = screen.getByRole("textbox", { name: "Resolved file content" }) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Ours modification\n");
  });

  it("accepts theirs into result pane", () => {
    render(<GitConflictResolver />);
    const theirsBtn = screen.getByRole("button", { name: /theirs/i });
    fireEvent.click(theirsBtn);

    const textarea = screen.getByRole("textbox", { name: "Resolved file content" }) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Theirs modification\n");
  });

  it("marks conflict resolved", async () => {
    const { resolveGitConflict } = await import("../api/gitClient");
    render(<GitConflictResolver />);

    const resolveBtn = screen.getByRole("button", { name: /mark resolved/i });
    fireEvent.click(resolveBtn);

    expect(resolveGitConflict).toHaveBeenCalledWith(
      "notes/conflict.md",
      expect.stringContaining("Ours modification"),
    );
  });

  it("handles abort merge with confirmation", async () => {
    const { abortGitMerge } = await import("../api/gitClient");
    render(<GitConflictResolver />);

    const abortBtn = screen.getByRole("button", { name: "Abort Merge" });
    fireEvent.click(abortBtn);

    expect(screen.getByText("Abort merge and revert all unresolved changes?")).toBeDefined();

    const confirmBtn = screen.getByRole("button", { name: "Confirm Abort" });
    fireEvent.click(confirmBtn);

    expect(abortGitMerge).toHaveBeenCalled();
  });
});
