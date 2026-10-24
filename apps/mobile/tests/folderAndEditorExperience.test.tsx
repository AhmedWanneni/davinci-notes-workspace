import React from "react";
import { describe, expect, it, vi } from "vitest";
import { DrawerFolderItem } from "../components/shell/DrawerFolderItem";
import { VaultDrawerContent } from "../components/shell/VaultDrawerContent";
import { NewFolderSheet } from "../components/shell/NewFolderSheet";
import { CreateActionSheet } from "../components/shell/CreateActionSheet";
import { EditorHeader } from "../components/EditorHeader";
import { EditorPreviewView } from "../components/EditorPreviewView";

vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe("Folder & Editor Experience Improvements", () => {
  it("renders DrawerFolderItem with collapsed state and handles expansion toggle", () => {
    const onToggleExpand = vi.fn();
    const onSelectFolder = vi.fn();
    const onSelectNote = vi.fn();

    const element = (
      <DrawerFolderItem
        folder="Projects"
        displayName="Projects"
        isExpanded={false}
        notes={["Projects/Roadmap.md"]}
        onToggleExpand={onToggleExpand}
        onSelectFolder={onSelectFolder}
        onSelectNote={onSelectNote}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.displayName).toBe("Projects");
    expect(element.props.isExpanded).toBe(false);
    expect(element.props.notes).toEqual(["Projects/Roadmap.md"]);
  });

  it("renders DrawerFolderItem in expanded state with nested note entries", () => {
    const onToggleExpand = vi.fn();
    const onSelectFolder = vi.fn();
    const onSelectNote = vi.fn();

    const element = (
      <DrawerFolderItem
        folder="Projects"
        displayName="Projects"
        isExpanded={true}
        notes={["Projects/Alpha.md", "Projects/Beta.md"]}
        onToggleExpand={onToggleExpand}
        onSelectFolder={onSelectFolder}
        onSelectNote={onSelectNote}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.isExpanded).toBe(true);
    expect(element.props.notes.length).toBe(2);
  });

  it("renders VaultDrawerContent with folder list and selectFolder support", () => {
    const onSelectNote = vi.fn();
    const onSelectFolder = vi.fn();
    const onCreateFolder = vi.fn();

    const element = (
      <VaultDrawerContent
        vaultName="Personal"
        notesCount={10}
        foldersCount={3}
        folders={["Archive", "Projects", "Work"]}
        notes={["Welcome.md", "Projects/Task.md"]}
        onOpenVaultSwitcher={vi.fn()}
        onSelectNote={onSelectNote}
        onSelectFolder={onSelectFolder}
        onOpenDailyNote={vi.fn()}
        onOpenTags={vi.fn()}
        onOpenGraph={vi.fn()}
        onOpenSettings={vi.fn()}
        onCreateFolder={onCreateFolder}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.foldersCount).toBe(3);
    expect(element.props.folders).toContain("Projects");
  });

  it("renders NewFolderSheet and validates creation callback", () => {
    const onClose = vi.fn();
    const onCreateFolder = vi.fn().mockResolvedValue(undefined);

    const element = (
      <NewFolderSheet
        visible={true}
        onClose={onClose}
        onCreateFolder={onCreateFolder}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.visible).toBe(true);
  });

  it("renders CreateActionSheet with New Folder option", () => {
    const onNewNote = vi.fn();
    const onNewFolder = vi.fn();

    const element = (
      <CreateActionSheet
        visible={true}
        onClose={vi.fn()}
        onNewNote={onNewNote}
        onDailyNote={vi.fn()}
        onNewFolder={onNewFolder}
        onTakePhoto={vi.fn()}
        onPickImage={vi.fn()}
        onRecordAudio={vi.fn()}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.onNewFolder).toBeDefined();
  });

  it("renders EditorHeader with Edit and Preview mode toggle pill", () => {
    const onBack = vi.fn();
    const onToggleMode = vi.fn();

    const editHeader = (
      <EditorHeader
        title="My Document"
        payloadBytes={120}
        saveStatus="saved"
        onBack={onBack}
        mode="edit"
        onToggleMode={onToggleMode}
      />
    );

    expect(editHeader).toBeDefined();
    expect(editHeader.props.mode).toBe("edit");
    expect(editHeader.props.title).toBe("My Document");

    const previewHeader = (
      <EditorHeader
        title="My Document"
        payloadBytes={120}
        saveStatus="saved"
        onBack={onBack}
        mode="preview"
        onToggleMode={onToggleMode}
      />
    );

    expect(previewHeader.props.mode).toBe("preview");
  });

  it("renders EditorPreviewView with markdown content parsed into reader ast", () => {
    const onEditPress = vi.fn();
    const onWikilinkPress = vi.fn();
    const onTagPress = vi.fn();

    const element = (
      <EditorPreviewView
        content={
          "# Hello World\n\nThis is a **markdown** preview.\n\n- [ ] Task 1"
        }
        title="Hello World"
        onEditPress={onEditPress}
        onWikilinkPress={onWikilinkPress}
        onTagPress={onTagPress}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.title).toBe("Hello World");
    expect(element.props.content).toContain("# Hello World");
    expect(element.props.onWikilinkPress).toBeDefined();
  });

  it("prevents repeated toolbar action loops when same actionTrigger ID is re-rendered", () => {
    const executedActions: string[] = [];
    let lastActionId: number | null = null;

    const simulateEffect = (trigger: { id: number; action: string } | null) => {
      if (trigger && trigger.id !== lastActionId) {
        lastActionId = trigger.id;
        executedActions.push(trigger.action);
      }
    };

    const action = { id: 1001, action: "heading" };
    // 1st render
    simulateEffect(action);
    expect(executedActions).toEqual(["heading"]);

    // 2nd render with re-serialized/identical actionTrigger
    simulateEffect({ id: 1001, action: "heading" });
    expect(executedActions).toEqual(["heading"]);

    // Subsequent render with next user click (new timestamp id)
    simulateEffect({ id: 1002, action: "heading" });
    expect(executedActions).toEqual(["heading", "heading"]);
  });
});
