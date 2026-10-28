// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VaultWelcomeView } from "./VaultWelcomeView";

describe("VaultWelcomeView", () => {
  it("renders welcoming title and action cards", () => {
    render(
      <VaultWelcomeView
        isLoadingVault={false}
        vaultError={null}
        onClearError={vi.fn()}
        onOpenPicker={vi.fn()}
        onCreateNewVault={vi.fn()}
        onOpenFixture={vi.fn()}
      />,
    );

    expect(screen.getByText("DaVinci Notes")).toBeDefined();
    expect(screen.getByText("Open Existing Vault")).toBeDefined();
    expect(screen.getByText("Create New Vault")).toBeDefined();
    expect(screen.getByTestId("btn-open-demo")).toBeDefined();
  });

  it("handles Open Folder click", () => {
    const onOpen = vi.fn();
    render(
      <VaultWelcomeView
        isLoadingVault={false}
        vaultError={null}
        onClearError={vi.fn()}
        onOpenPicker={onOpen}
        onCreateNewVault={vi.fn()}
        onOpenFixture={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Folder" }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("handles Create Vault click", () => {
    const onCreate = vi.fn();
    render(
      <VaultWelcomeView
        isLoadingVault={false}
        vaultError={null}
        onClearError={vi.fn()}
        onOpenPicker={vi.fn()}
        onCreateNewVault={onCreate}
        onOpenFixture={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Create Vault" }));
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it("renders error state when vaultError is set", () => {
    const onClear = vi.fn();
    render(
      <VaultWelcomeView
        isLoadingVault={false}
        vaultError="Directory does not exist"
        onClearError={onClear}
        onOpenPicker={vi.fn()}
        onCreateNewVault={vi.fn()}
        onOpenFixture={vi.fn()}
      />,
    );

    expect(screen.getByText("Directory does not exist")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("handles Open from Drive click when provided", () => {
    const onOpenDrive = vi.fn();
    render(
      <VaultWelcomeView
        isLoadingVault={false}
        vaultError={null}
        onClearError={vi.fn()}
        onOpenPicker={vi.fn()}
        onOpenVaultFromDrive={onOpenDrive}
        onOpenFixture={vi.fn()}
      />,
    );

    expect(screen.getByText("Open from Google Drive")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Open from Drive" }));
    expect(onOpenDrive).toHaveBeenCalledOnce();
  });
});
