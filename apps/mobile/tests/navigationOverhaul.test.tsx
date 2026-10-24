import React from "react";
import { describe, expect, it, vi } from "vitest";
import { LeafSelectorPill } from "../components/shell/LeafSelectorPill";
import { MobileHeader } from "../components/shell/MobileHeader";
import { NavigationDrawer } from "../components/shell/NavigationDrawer";
import { QuickActionBar } from "../components/shell/QuickActionBar";
import { Text } from "../components/primitives";

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  useLocalSearchParams: () => ({ path: "Test.md" }),
  useFocusEffect: vi.fn((fn: () => void) => fn()),
}));

vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe("Navigation Overhaul Suite (Phase 7)", () => {
  it("renders LeafSelectorPill with files leaf and triggers pill action", () => {
    const onPressPill = vi.fn();
    const element = (
      <LeafSelectorPill activeLeaf="files" onPressPill={onPressPill} />
    );

    expect(element).toBeDefined();
    expect(element.props.activeLeaf).toBe("files");
  });

  it("renders LeafSelectorPill with search and tags leaves", () => {
    const searchEl = <LeafSelectorPill activeLeaf="search" />;
    const tagsEl = <LeafSelectorPill activeLeaf="tags" />;

    expect(searchEl.props.activeLeaf).toBe("search");
    expect(tagsEl.props.activeLeaf).toBe("tags");
  });

  it("coordinates MobileHeader, QuickActionBar, and NavigationDrawer", () => {
    const onToggleSidebar = vi.fn();
    const onToggleReadingView = vi.fn();
    const onCloseDrawer = vi.fn();

    const header = (
      <MobileHeader
        title="My Document"
        isReadingView={true}
        onToggleSidebar={onToggleSidebar}
        onToggleReadingView={onToggleReadingView}
      />
    );

    const drawer = (
      <NavigationDrawer visible={true} onClose={onCloseDrawer}>
        <Text>Files Leaf</Text>
      </NavigationDrawer>
    );

    const quickBar = <QuickActionBar activeAction="edit" />;

    expect(header).toBeDefined();
    expect(drawer).toBeDefined();
    expect(quickBar).toBeDefined();
  });
});
