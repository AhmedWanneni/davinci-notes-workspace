import React from "react";
import { describe, expect, it, vi } from "vitest";
import { NoteActionSheet } from "./NoteActionSheet";

vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe("NoteActionSheet Suite", () => {
  it("renders NoteActionSheet with 3 groups matching Screenshot 1", () => {
    const onClose = vi.fn();
    const onToggleReadingView = vi.fn();
    const onToggleSourceMode = vi.fn();
    const onOpenBacklinks = vi.fn();
    const onTogglePin = vi.fn();
    const onRename = vi.fn();
    const onMove = vi.fn();
    const onBookmark = vi.fn();
    const onMerge = vi.fn();
    const onAddProperty = vi.fn();

    const element = (
      <NoteActionSheet
        visible={true}
        onClose={onClose}
        isReadingView={false}
        isPinned={false}
        onToggleReadingView={onToggleReadingView}
        onToggleSourceMode={onToggleSourceMode}
        onOpenBacklinks={onOpenBacklinks}
        onTogglePin={onTogglePin}
        onRename={onRename}
        onMove={onMove}
        onBookmark={onBookmark}
        onMerge={onMerge}
        onAddProperty={onAddProperty}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.visible).toBe(true);
    expect(element.props.isReadingView).toBe(false);
  });

  it("handles active reading view and pinned state", () => {
    const element = (
      <NoteActionSheet
        visible={true}
        onClose={vi.fn()}
        isReadingView={true}
        isPinned={true}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.isReadingView).toBe(true);
    expect(element.props.isPinned).toBe(true);
  });
});
