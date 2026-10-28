// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DropdownMenu, DropdownMenuContent } from "@app/design-system";
import { VaultSwitcherRecentItem, type VaultSwitcherRecentItemProps } from "./VaultSwitcherRecentItem";

function renderWithMenu(props: VaultSwitcherRecentItemProps) {
  return render(
    <DropdownMenu open>
      <DropdownMenuContent>
        <VaultSwitcherRecentItem {...props} />
      </DropdownMenuContent>
    </DropdownMenu>,
  );
}

describe("VaultSwitcherRecentItem", () => {
  it("renders active vault with active check indicator", () => {
    const onSwitch = vi.fn();
    const onRemove = vi.fn();
    renderWithMenu({
      entry: { name: "Active Vault", path: "/path/active", exists: true, lastOpenedAt: 100 },
      isCurrent: true,
      onSwitchVault: onSwitch,
      onRemove: onRemove,
    });

    expect(screen.getByText("Active Vault")).toBeDefined();
    expect(screen.getByText("/path/active")).toBeDefined();
    expect(screen.getByLabelText("Active vault")).toBeDefined();
  });

  it("calls onSwitchVault when an inactive existing vault is clicked", () => {
    const onSwitch = vi.fn();
    const onRemove = vi.fn();
    renderWithMenu({
      entry: { name: "Other Vault", path: "/path/other", exists: true, lastOpenedAt: 90 },
      isCurrent: false,
      onSwitchVault: onSwitch,
      onRemove: onRemove,
    });

    fireEvent.click(screen.getByText("Other Vault"));
    expect(onSwitch).toHaveBeenCalledWith("/path/other");
  });

  it("renders missing tag and calls onRemove when remove button is clicked", () => {
    const onSwitch = vi.fn();
    const onRemove = vi.fn();
    renderWithMenu({
      entry: { name: "Missing Vault", path: "/path/missing", exists: false, lastOpenedAt: 50 },
      isCurrent: false,
      onSwitchVault: onSwitch,
      onRemove: onRemove,
    });

    expect(screen.getByText("Missing")).toBeDefined();
    const removeBtn = screen.getByRole("button", { name: "Remove Missing Vault from list" });
    fireEvent.click(removeBtn);
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onSwitch).not.toHaveBeenCalled();
  });
});
