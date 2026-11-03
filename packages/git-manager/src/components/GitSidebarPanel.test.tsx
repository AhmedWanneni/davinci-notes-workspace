import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { GitSidebarPanel } from "./GitSidebarPanel";
import { useGitManagerStore } from "../store/useGitManagerStore";

vi.mock("../api/gitClient", () => ({
  listenToGitChanges: vi.fn().mockResolvedValue(() => {}),
  getRepoInfo: vi.fn().mockResolvedValue({
    isRepo: true,
    gitAvailable: true,
    branch: "feat/website-setup",
  }),
  getStatusPorcelainV2: vi.fn().mockResolvedValue({
    staged: [],
    unstaged: [
      { path: "playwright.config.ts", statusCode: "M", staged: false },
      { path: "README.md", statusCode: "M", staged: false },
      { path: "ContactForm.tsx", statusCode: "M", staged: false },
    ],
    conflicts: [],
  }),
  getCommitLog: vi.fn().mockResolvedValue([]),
}));

describe("GitSidebarPanel", () => {
  beforeEach(() => {
    useGitManagerStore.setState({
      repoInfo: {
        isRepo: true,
        gitAvailable: true,
        branch: "feat/website-setup",
        rootPath: "/vault",
      },
      isLoading: false,
      staged: [],
      unstaged: [
        { path: "playwright.config.ts", statusCode: "M", staged: false },
        { path: "README.md", statusCode: "M", staged: false },
        { path: "ContactForm.tsx", statusCode: "M", staged: false },
      ],
      conflicts: [],
      graphNodes: [],
    });
  });

  it("does not render Agent Review or GitLens sections", () => {
    render(<GitSidebarPanel />);
    expect(screen.queryByText("Agent Review")).toBeNull();
    expect(screen.queryByText("GitLens")).toBeNull();
  });

  it("renders CHANGES header with action toolbar", () => {
    render(<GitSidebarPanel />);
    expect(screen.getByText("CHANGES")).toBeDefined();
    expect(screen.getByLabelText("View as Tree / List")).toBeDefined();
    expect(screen.getByLabelText("Open All Changes")).toBeDefined();
    expect(screen.getByLabelText("Generate Commit Message")).toBeDefined();
    expect(screen.getByLabelText("Pull Changes")).toBeDefined();
    expect(screen.getByLabelText("Toggle Git Graph")).toBeDefined();
    expect(screen.getByLabelText("Commit")).toBeDefined();
    expect(screen.getByLabelText("Refresh")).toBeDefined();
    expect(screen.getByLabelText("More Actions")).toBeDefined();
  });

  it("renders Commit box and Changes list with files", () => {
    render(<GitSidebarPanel />);
    expect(screen.getByTestId("git-commit-box")).toBeDefined();
    expect(screen.getByText("Changes")).toBeDefined();
    expect(screen.getByText("playwright.config.ts")).toBeDefined();
    expect(screen.getByText("README.md")).toBeDefined();
    expect(screen.getByText("ContactForm.tsx")).toBeDefined();
  });
});
