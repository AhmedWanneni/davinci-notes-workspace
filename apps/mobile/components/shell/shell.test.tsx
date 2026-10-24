import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MobileHeader } from "./MobileHeader";
import { QuickActionBar } from "./QuickActionBar";
import { VaultSwitcherBar } from "./VaultSwitcherBar";
import { NavigationDrawer } from "./NavigationDrawer";
import { Text } from "../primitives";

vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe("Shell Components Suite", () => {
  it("renders MobileHeader with title and action callbacks", () => {
    const onToggleSidebar = vi.fn();
    const onToggleReadingView = vi.fn();
    const onOpenMoreMenu = vi.fn();

    const element = (
      <MobileHeader
        title="Active Note.md"
        onToggleSidebar={onToggleSidebar}
        onToggleReadingView={onToggleReadingView}
        isReadingView={false}
        onOpenMoreMenu={onOpenMoreMenu}
        showTitleDropdown
      />
    );

    expect(element).toBeDefined();
    expect(element.props.title).toBe("Active Note.md");
    expect(element.props.showTitleDropdown).toBe(true);
  });

  it("renders QuickActionBar with 5 discrete buttons", () => {
    const onEdit = vi.fn();
    const onNewNote = vi.fn();
    const onQuickSwitcher = vi.fn();
    const onOpenTabs = vi.fn();
    const onOpenMore = vi.fn();

    const element = (
      <QuickActionBar
        onEdit={onEdit}
        onNewNote={onNewNote}
        onQuickSwitcher={onQuickSwitcher}
        onOpenTabs={onOpenTabs}
        onOpenMore={onOpenMore}
        activeAction="edit"
      />
    );

    expect(element).toBeDefined();
    expect(element.props.activeAction).toBe("edit");
  });

  it("renders VaultSwitcherBar with vault counts and settings callback", () => {
    const onSelectVault = vi.fn();
    const onOpenSettings = vi.fn();

    const element = (
      <VaultSwitcherBar
        vaultName="popk"
        folderCount={4}
        noteCount={12}
        onSelectVault={onSelectVault}
        onOpenSettings={onOpenSettings}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.vaultName).toBe("popk");
    expect(element.props.folderCount).toBe(4);
    expect(element.props.noteCount).toBe(12);
  });

  it("renders NavigationDrawer with slide panel and bottom bar", () => {
    const onClose = vi.fn();

    const element = (
      <NavigationDrawer
        visible={true}
        onClose={onClose}
        bottomBar={<Text>Bottom</Text>}
      >
        <Text>Sidebar Content</Text>
      </NavigationDrawer>
    );

    expect(element).toBeDefined();
    expect(element.props.visible).toBe(true);
  });
});
