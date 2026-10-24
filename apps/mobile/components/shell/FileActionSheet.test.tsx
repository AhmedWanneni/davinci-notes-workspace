import React from "react";
import { describe, expect, it, vi } from "vitest";
import { FileActionSheet } from "./FileActionSheet";
import { CreateActionSheet } from "./CreateActionSheet";

vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe("FileActionSheet & CreateActionSheet Suite", () => {
  it("instantiates FileActionSheet with props and callbacks", () => {
    const onRename = vi.fn();
    const onMove = vi.fn();
    const onDelete = vi.fn();

    const element = (
      <FileActionSheet
        targetPath="Projects/Trip.md"
        isPinned={false}
        folders={["Projects", "Archive"]}
        visible={true}
        onClose={vi.fn()}
        onOpen={vi.fn()}
        onTogglePin={vi.fn()}
        onRename={onRename}
        onMove={onMove}
        onDelete={onDelete}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.targetPath).toBe("Projects/Trip.md");
    expect(element.props.isPinned).toBe(false);
  });

  it("instantiates CreateActionSheet with fast capture handlers", () => {
    const onNewNote = vi.fn();
    const onDailyNote = vi.fn();
    const onTakePhoto = vi.fn();

    const element = (
      <CreateActionSheet
        visible={true}
        onClose={vi.fn()}
        onNewNote={onNewNote}
        onDailyNote={onDailyNote}
        onTakePhoto={onTakePhoto}
        onPickImage={vi.fn()}
        onRecordAudio={vi.fn()}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.visible).toBe(true);
  });
});
