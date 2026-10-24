// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { TooltipProvider } from "@app/design-system";
import {
  createWebPlatformAdapters,
  OpfsFileSystemAdapter,
  setPlatformAdapters,
} from "@app/platform-adapters";
import { App } from "../../desktop/src/App";
import { useWorkspaceStore } from "../../desktop/src/state/useWorkspaceStore";
import { closeVault } from "../../desktop/src/vault";
import { vaultArchive } from "./vault";

describe("DaVinci Notes Web — Full Desktop UI & Vault Selection", () => {
  let fs: OpfsFileSystemAdapter;

  beforeEach(async () => {
    fs = new OpfsFileSystemAdapter();
    setPlatformAdapters(createWebPlatformAdapters({ fs }));
    await closeVault();
    useWorkspaceStore.setState({ vaultPath: null });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the desktop VaultWelcomeView with vault selection actions and opens the full desktop workspace", async () => {
    render(
      <TooltipProvider delayDuration={300}>
        <App />
      </TooltipProvider>,
    );

    expect(screen.getByText("DaVinci Notes")).toBeDefined();
    expect(screen.getByText("No Vault Open")).toBeDefined();
    expect(screen.getByText("Open fixture")).toBeDefined();
    expect(screen.getByText("Index large fixture (350 notes)")).toBeDefined();
    expect(screen.getByText(/Pick folder & index/i)).toBeDefined();

    fireEvent.click(screen.getByText("Open fixture"));

    await waitFor(() => {
      expect(useWorkspaceStore.getState().allNotePaths).toEqual([
        "Architecture.md",
        "Getting Started.md",
        "Welcome.md",
      ]);
      expect(screen.getByLabelText("Primary navigation")).toBeDefined();
    });
  });

  it("opens a vault via Pick folder & index in browser mode", async () => {
    render(
      <TooltipProvider delayDuration={300}>
        <App />
      </TooltipProvider>,
    );

    fireEvent.click(screen.getByText(/Pick folder & index/i));

    await waitFor(() => {
      expect(screen.getAllByText("Browser Vault").length).toBeGreaterThan(0);
      expect(useWorkspaceStore.getState().allNotePaths).toContain("Welcome.md");
    });
  });

  it("exports and imports a complete vault archive losslessly across OPFS vaults", async () => {
    await fs.writeTextFile(
      "vault/Welcome.md",
      "---\ntags: [onboarding]\n---\n# Welcome\nLink to [[Roadmap]] #web\n",
    );
    await fs.writeBinaryFile(
      "vault/assets/diagram.bin",
      new Uint8Array([1, 2, 3, 4, 255]),
    );

    const archiveBytes = await vaultArchive.exportVaultArchive(fs, "vault");
    expect(archiveBytes.byteLength).toBeGreaterThan(50);

    const targetFs = new OpfsFileSystemAdapter();
    const result = await vaultArchive.importVaultArchive(
      archiveBytes,
      targetFs,
      "restored",
    );
    expect(result.importedCount).toBe(2);

    const restoredWelcome = await targetFs.readTextFile("restored/Welcome.md");
    expect(restoredWelcome).toContain("[[Roadmap]]");

    const restoredBin = await targetFs.readBinaryFile(
      "restored/assets/diagram.bin",
    );
    expect(Array.from(restoredBin)).toEqual([1, 2, 3, 4, 255]);
  });
});
