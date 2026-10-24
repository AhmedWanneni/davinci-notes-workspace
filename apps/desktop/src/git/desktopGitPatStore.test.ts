import { beforeEach, describe, expect, it, vi } from "vitest";
import { setPlatformAdapters } from "@app/platform-adapters";
import { TauriSecretStoreAdapter } from "../adapters/TauriSecretStoreAdapter";

const invoke = vi.hoisted(() => vi.fn());
vi.mock("@tauri-apps/api/core", () => ({ invoke }));

import { desktopGitPatStore } from "./desktopGitPatStore";

describe("desktopGitPatStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPlatformAdapters({
      secrets: new TauriSecretStoreAdapter(),
    });
  });

  it("uses the identical secure command for GitHub and GitLab URLs", async () => {
    await desktopGitPatStore.save(
      "https://github.com/example/notes.git",
      "github-token",
    );
    await desktopGitPatStore.save(
      "https://gitlab.com/example/notes.git",
      "gitlab-token",
    );

    expect(invoke).toHaveBeenNthCalledWith(1, "save_git_pat", {
      remoteUrl: "https://github.com/example/notes.git",
      token: "github-token",
    });
    expect(invoke).toHaveBeenNthCalledWith(2, "save_git_pat", {
      remoteUrl: "https://gitlab.com/example/notes.git",
      token: "gitlab-token",
    });
  });
});
