// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecentVaultsCard } from "./RecentVaultsCard";
import type { RecentVaultEntry } from "../../vault/recentVaultsRegistry";

describe("RecentVaultsCard", () => {
  const sampleEntries: RecentVaultEntry[] = [
    {
      name: "Personal Notes",
      path: "/Users/me/Documents/Personal",
      lastOpenedAt: Date.now() - 1000 * 60 * 5, // 5m ago
      exists: true,
    },
    {
      name: "Old Archive",
      path: "/Volumes/Ext/Archive",
      lastOpenedAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2d ago
      exists: false,
    },
  ];

  it("renders recent vault entries with names and badges", () => {
    render(
      <RecentVaultsCard
        entries={sampleEntries}
        onSelectVault={vi.fn()}
        onRemoveVault={vi.fn()}
      />,
    );

    expect(screen.getByText("Personal Notes")).toBeDefined();
    expect(screen.getByText("/Users/me/Documents/Personal")).toBeDefined();
    expect(screen.getByText("Old Archive")).toBeDefined();
    expect(screen.getByText("Missing")).toBeDefined();
  });

  it("triggers onSelectVault when clicked", () => {
    const onSelect = vi.fn();
    render(
      <RecentVaultsCard
        entries={sampleEntries}
        onSelectVault={onSelect}
        onRemoveVault={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Open Personal Notes/i }));
    expect(onSelect).toHaveBeenCalledWith("/Users/me/Documents/Personal");
  });

  it("triggers onRemoveVault when delete button clicked", () => {
    const onRemove = vi.fn();
    render(
      <RecentVaultsCard
        entries={sampleEntries}
        onSelectVault={vi.fn()}
        onRemoveVault={onRemove}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Remove Old Archive from recent vaults/i }),
    );
    expect(onRemove).toHaveBeenCalledWith("/Volumes/Ext/Archive");
  });
});
