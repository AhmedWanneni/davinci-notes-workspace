// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitCloneRepoCard } from "./GitCloneRepoCard";
import { cloneGitRepository } from "@app/git-manager";
import { pickVaultFolder } from "../../vault";

vi.mock("@app/git-manager", () => ({
  cloneGitRepository: vi.fn(),
}));

vi.mock("../../vault/sqliteIndex", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../vault/sqliteIndex")>();
  return {
    ...actual,
    withDbLock: vi.fn().mockImplementation((fn: () => unknown) => fn()),
    getVaultIndexDb: vi.fn().mockResolvedValue({
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockResolvedValue([]),
    }),
  };
});

vi.mock("../../vault", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../vault")>();
  return {
    ...actual,
    pickVaultFolder: vi.fn(),
    getVaultIndexDb: vi.fn().mockResolvedValue({
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockResolvedValue([]),
    }),
  };
});

describe("GitCloneRepoCard", () => {
  const onVaultSwitched = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders inputs for repository URL, destination, and token", () => {
    render(<GitCloneRepoCard onVaultSwitched={onVaultSwitched} />);

    expect(screen.getByText("Open Vault from GitHub")).toBeDefined();
    expect(screen.getByLabelText("GitHub repository URL")).toBeDefined();
    expect(screen.getByLabelText("Local destination folder")).toBeDefined();
    expect(screen.getByLabelText("Personal access token")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Clone and Open Vault" }),
    ).toBeDefined();
  });

  it("disables Clone button when required fields are empty", () => {
    render(<GitCloneRepoCard onVaultSwitched={onVaultSwitched} />);

    const cloneBtn = screen.getByRole("button", {
      name: "Clone and Open Vault",
    });
    expect(cloneBtn.hasAttribute("disabled")).toBe(true);
  });

  it("updates destination when Browse button selects a directory", async () => {
    vi.mocked(pickVaultFolder).mockResolvedValue("/Users/test/vaults");

    render(<GitCloneRepoCard onVaultSwitched={onVaultSwitched} />);

    const urlInput = screen.getByLabelText("GitHub repository URL");
    fireEvent.change(urlInput, {
      target: { value: "https://github.com/user/my-notes.git" },
    });

    const browseBtn = screen.getByRole("button", { name: "Browse" });
    fireEvent.click(browseBtn);

    await waitFor(() => {
      const destInput = screen.getByLabelText(
        "Local destination folder",
      ) as HTMLInputElement;
      expect(destInput.value).toBe("/Users/test/vaults/my-notes");
    });
  });

  it("calls cloneGitRepository and onVaultSwitched on successful clone", async () => {
    vi.mocked(cloneGitRepository).mockResolvedValue("/cloned/path/my-notes");

    render(<GitCloneRepoCard onVaultSwitched={onVaultSwitched} />);

    const urlInput = screen.getByLabelText("GitHub repository URL");
    const destInput = screen.getByLabelText("Local destination folder");
    const tokenInput = screen.getByLabelText("Personal access token");

    fireEvent.change(urlInput, {
      target: { value: "https://github.com/user/my-notes.git" },
    });
    fireEvent.change(destInput, {
      target: { value: "/cloned/path/my-notes" },
    });
    fireEvent.change(tokenInput, {
      target: { value: "ghp_secret_token" },
    });

    const cloneBtn = screen.getByRole("button", {
      name: "Clone and Open Vault",
    });
    expect(cloneBtn.hasAttribute("disabled")).toBe(false);
    fireEvent.click(cloneBtn);

    await waitFor(() => {
      expect(cloneGitRepository).toHaveBeenCalledWith(
        "https://github.com/user/my-notes.git",
        "/cloned/path/my-notes",
        "ghp_secret_token",
      );
      expect(onVaultSwitched).toHaveBeenCalledWith("/cloned/path/my-notes");
    });
  });

  it("displays error message if clone fails", async () => {
    vi.mocked(cloneGitRepository).mockRejectedValue(
      new Error("Destination directory is not empty."),
    );

    render(<GitCloneRepoCard onVaultSwitched={onVaultSwitched} />);

    const urlInput = screen.getByLabelText("GitHub repository URL");
    const destInput = screen.getByLabelText("Local destination folder");

    fireEvent.change(urlInput, {
      target: { value: "https://github.com/user/my-notes.git" },
    });
    fireEvent.change(destInput, {
      target: { value: "/cloned/path/my-notes" },
    });

    const cloneBtn = screen.getByRole("button", {
      name: "Clone and Open Vault",
    });
    fireEvent.click(cloneBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Destination directory is not empty."),
      ).toBeDefined();
    });
  });
});
