// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VaultSwitcher } from "./VaultSwitcher";
import * as vaultModule from "../../vault";

vi.mock("../../vault", () => ({
  getRecentVaults: vi.fn().mockResolvedValue([
    {
      path: "/vaults/active",
      name: "Active Vault",
      lastOpenedAt: 200,
      exists: true,
    },
    {
      path: "/vaults/other",
      name: "Other Vault",
      lastOpenedAt: 100,
      exists: true,
    },
    {
      path: "/vaults/missing",
      name: "Missing Vault",
      lastOpenedAt: 50,
      exists: false,
    },
  ]),
  removeRecentVault: vi.fn().mockResolvedValue([]),
}));

beforeAll(() => {
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.setPointerCapture = () => {};
  window.HTMLElement.prototype.releasePointerCapture = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
});

describe("VaultSwitcher", () => {
  const onOpenSettings = vi.fn();
  const onOpenHelp = vi.fn();
  const onSwitchVault = vi.fn();
  const onOpenFolderPicker = vi.fn();
  const onCreateNewVault = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders vault name and action buttons", () => {
    render(
      <VaultSwitcher
        vaultName="Active Vault"
        vaultPath="/vaults/active"
        onOpenSettings={onOpenSettings}
        onOpenHelp={onOpenHelp}
        onSwitchVault={onSwitchVault}
        onOpenFolderPicker={onOpenFolderPicker}
        onCreateNewVault={onCreateNewVault}
      />,
    );

    expect(screen.getByText("Active Vault")).toBeDefined();
    expect(screen.getByLabelText("Help")).toBeDefined();
  });

  it("triggers onOpenHelp when clicked", () => {
    render(
      <VaultSwitcher
        vaultName="Active Vault"
        vaultPath="/vaults/active"
        onOpenSettings={onOpenSettings}
        onOpenHelp={onOpenHelp}
        onSwitchVault={onSwitchVault}
        onOpenFolderPicker={onOpenFolderPicker}
      />,
    );

    fireEvent.click(screen.getByLabelText("Help"));
    expect(onOpenHelp).toHaveBeenCalledTimes(1);
  });

  it("opens menu with recent vaults on trigger click", async () => {
    render(
      <VaultSwitcher
        vaultName="Active Vault"
        vaultPath="/vaults/active"
        onOpenSettings={onOpenSettings}
        onOpenHelp={onOpenHelp}
        onSwitchVault={onSwitchVault}
        onOpenFolderPicker={onOpenFolderPicker}
        onCreateNewVault={onCreateNewVault}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: /Current vault: Active Vault/i,
    });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Other Vault")).toBeDefined();
      expect(screen.getByText("Missing Vault")).toBeDefined();
      expect(screen.getByText("Open folder as vault…")).toBeDefined();
      expect(screen.getByText("Create new vault…")).toBeDefined();
    });

    expect(screen.getByLabelText("Active vault")).toBeDefined();
  });

  it("switches to selected vault when clicked in menu", async () => {
    render(
      <VaultSwitcher
        vaultName="Active Vault"
        vaultPath="/vaults/active"
        onOpenSettings={onOpenSettings}
        onOpenHelp={onOpenHelp}
        onSwitchVault={onSwitchVault}
        onOpenFolderPicker={onOpenFolderPicker}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: /Current vault: Active Vault/i,
    });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Other Vault")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Other Vault"));
    expect(onSwitchVault).toHaveBeenCalledWith("/vaults/other");
  });

  it("calls removeRecentVault when remove button on missing vault is clicked", async () => {
    render(
      <VaultSwitcher
        vaultName="Active Vault"
        vaultPath="/vaults/active"
        onOpenSettings={onOpenSettings}
        onOpenHelp={onOpenHelp}
        onSwitchVault={onSwitchVault}
        onOpenFolderPicker={onOpenFolderPicker}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: /Current vault: Active Vault/i,
    });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Missing Vault")).toBeDefined();
    });

    const removeBtn = screen.getByLabelText("Remove Missing Vault from list");
    fireEvent.click(removeBtn);
    expect(vaultModule.removeRecentVault).toHaveBeenCalledWith(
      "/vaults/missing",
    );
  });

  it("calls onOpenLogs when 'View vault logs…' is clicked in menu", async () => {
    const onOpenLogs = vi.fn();
    render(
      <VaultSwitcher
        vaultName="Active Vault"
        vaultPath="/vaults/active"
        onOpenSettings={onOpenSettings}
        onOpenHelp={onOpenHelp}
        onSwitchVault={onSwitchVault}
        onOpenFolderPicker={onOpenFolderPicker}
        onOpenLogs={onOpenLogs}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: /Current vault: Active Vault/i,
    });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("View vault logs…")).toBeDefined();
    });

    fireEvent.click(screen.getByText("View vault logs…"));
    expect(onOpenLogs).toHaveBeenCalledTimes(1);
  });

  it("renders collapsed trigger when isCollapsed is true", () => {
    render(
      <VaultSwitcher
        isCollapsed
        vaultName="Active Vault"
        vaultPath="/vaults/active"
        onSwitchVault={onSwitchVault}
        onOpenFolderPicker={onOpenFolderPicker}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: /Current vault: Active Vault/i,
    });
    expect(trigger.getAttribute("data-collapsed")).toBe("true");
    expect(screen.queryByText("Active Vault")).toBeNull();
  });

  it("renders sync vault item and responds to click when onSyncVault is provided", async () => {
    const onSyncVault = vi.fn();
    render(
      <VaultSwitcher
        vaultName="Active Vault"
        vaultPath="/vaults/active"
        onSwitchVault={onSwitchVault}
        onOpenFolderPicker={onOpenFolderPicker}
        onSyncVault={onSyncVault}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: /Current vault: Active Vault/i,
    });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Sync vault with Drive…")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Sync vault with Drive…"));
    expect(onSyncVault).toHaveBeenCalledTimes(1);
  });

  it("renders open vault from drive item and responds to click when onOpenVaultFromDrive is provided", async () => {
    const onOpenVaultFromDrive = vi.fn();
    render(
      <VaultSwitcher
        vaultName="Active Vault"
        vaultPath="/vaults/active"
        onSwitchVault={onSwitchVault}
        onOpenFolderPicker={onOpenFolderPicker}
        onOpenVaultFromDrive={onOpenVaultFromDrive}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: /Current vault: Active Vault/i,
    });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Open vault from Drive…")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Open vault from Drive…"));
    expect(onOpenVaultFromDrive).toHaveBeenCalledTimes(1);
  });
});

