// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GitRemoteSetupPanel } from "./GitRemoteSetupPanel";
import { validateGitRemote } from "../../git/localGitHistory";
import { desktopGitPatStore } from "../../git/desktopGitPatStore";
import { saveCurrentVaultGitRemoteConfig } from "../../git/GitRemoteConfig";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../git/localGitHistory", () => ({
  validateGitRemote: vi.fn(),
}));

vi.mock("../../git/desktopGitPatStore", () => ({
  desktopGitPatStore: {
    save: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../git/GitRemoteConfig", () => ({
  saveCurrentVaultGitRemoteConfig: vi.fn().mockResolvedValue(undefined),
}));

describe("GitRemoteSetupPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.setState({
      gitEnabled: false,
    });
  });

  it("renders URL and token inputs with disabled submit button initially", () => {
    render(<GitRemoteSetupPanel />);
    const button = screen.getByRole("button", { name: "Validate and connect" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it("validates, saves credentials, and enables Git Manager on success", async () => {
    vi.mocked(validateGitRemote).mockResolvedValue({
      remoteState: "nonempty",
    });

    render(<GitRemoteSetupPanel />);

    const urlInput = screen.getByLabelText("Git repository URL");
    const tokenInput = screen.getByLabelText("Personal access token");
    const submitBtn = screen.getByRole("button", { name: "Validate and connect" }) as HTMLButtonElement;

    fireEvent.change(urlInput, {
      target: { value: "https://github.com/AhmedWanneni/test-vault-docs.git" },
    });
    fireEvent.change(tokenInput, {
      target: { value: "ghp_test123" },
    });

    expect(submitBtn.disabled).toBe(false);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(validateGitRemote).toHaveBeenCalledWith({
        remoteUrl: "https://github.com/AhmedWanneni/test-vault-docs.git",
        token: "ghp_test123",
        username: null,
      });
      expect(desktopGitPatStore.save).toHaveBeenCalled();
      expect(saveCurrentVaultGitRemoteConfig).toHaveBeenCalled();
      expect(useWorkspaceStore.getState().gitEnabled).toBe(true);
    });

    expect(
      screen.getByText(/Git Manager is now active in your icon rail/),
    ).toBeDefined();
  });
});
