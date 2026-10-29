import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitCommitBox } from "./GitCommitBox";
import { useGitManagerStore } from "../store/useGitManagerStore";

describe("GitCommitBox", () => {
  beforeEach(() => {
    useGitManagerStore.setState({
      staged: [{ path: "note.md", statusCode: "M", staged: true }],
      isLoading: false,
      error: null,
    });
  });

  it("renders textarea and commit button", () => {
    render(<GitCommitBox />);
    expect(screen.getByTestId("git-commit-box")).toBeDefined();
    expect(screen.getByPlaceholderText("Message (⌘Enter to commit)")).toBeDefined();
    expect(screen.getByTestId("git-commit-submit-btn")).toBeDefined();
  });

  it("disables commit button when commit message is empty", () => {
    render(<GitCommitBox />);
    const button = screen.getByTestId("git-commit-submit-btn");
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("enables commit button when message is typed and staged changes exist", () => {
    render(<GitCommitBox />);
    const textarea = screen.getByPlaceholderText("Message (⌘Enter to commit)");
    fireEvent.change(textarea, { target: { value: "feat: add note" } });

    const button = screen.getByTestId("git-commit-submit-btn");
    expect(button.hasAttribute("disabled")).toBe(false);
  });

  it("calls commit on store when commit button clicked", async () => {
    const commitMock = vi.fn().mockResolvedValue("abcdef1234567890");
    useGitManagerStore.setState({ commit: commitMock });

    render(<GitCommitBox />);
    const textarea = screen.getByPlaceholderText("Message (⌘Enter to commit)");
    fireEvent.change(textarea, { target: { value: "feat: valid commit" } });

    const button = screen.getByTestId("git-commit-submit-btn");
    await act(async () => {
      fireEvent.click(button);
    });

    expect(commitMock).toHaveBeenCalledWith("feat: valid commit", false);
  });
});
