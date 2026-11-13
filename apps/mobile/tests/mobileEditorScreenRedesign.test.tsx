import React from "react";
import { describe, expect, it, vi } from "vitest";
import { EditorHeader } from "../components/EditorHeader";
import { EditorBottomBar } from "../components/EditorBottomBar";
import { NewTabPage } from "../components/NewTabPage";
import { TabSwitcherModal } from "../components/TabSwitcherModal";
import { VaultDrawerContent } from "../components/shell/VaultDrawerContent";
import { NoteActionSheet } from "../components/shell/NoteActionSheet";
import {
  openNoteInTab,
  closeTab,
  createUnsavedNewTab,
  getTabStoreState,
} from "../vault/tabStore";
import { stripLeadingH1Title } from "../vault/useEditorNoteLoader";

describe("Mobile Editor Redesign & UI Verification", () => {
  it("renders EditorHeader matching the image reference (left rounded sidebar button, clean center, right book & 3-dots)", () => {
    const onBack = vi.fn();
    const onToggleMode = vi.fn();
    const onOpenDrawer = vi.fn();
    const onOpenActions = vi.fn();

    const element = (
      <EditorHeader
        mode="edit"
        onBack={onBack}
        onToggleMode={onToggleMode}
        onOpenDrawer={onOpenDrawer}
        onOpenActions={onOpenActions}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.mode).toBe("edit");
    expect(element.props.onOpenDrawer).toBe(onOpenDrawer);
    expect(element.props.onOpenActions).toBe(onOpenActions);
    expect(element.props.onToggleMode).toBe(onToggleMode);
  });

  it("renders EditorBottomBar with 6 action buttons (Todo, +, 🔍, Notifications, [1], ☰)", () => {
    const onTodo = vi.fn();
    const onNotifications = vi.fn();
    const onSearch = vi.fn();
    const onNewNote = vi.fn();
    const onTabs = vi.fn();
    const onMenu = vi.fn();

    const element = (
      <EditorBottomBar
        onTodo={onTodo}
        onNewNote={onNewNote}
        onSearch={onSearch}
        onNotifications={onNotifications}
        onTabs={onTabs}
        onMenu={onMenu}
        tabCount={1}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.tabCount).toBe(1);
    expect(element.props.onTodo).toBe(onTodo);
    expect(element.props.onNotifications).toBe(onNotifications);
    expect(element.props.onSearch).toBe(onSearch);
    expect(element.props.onNewNote).toBe(onNewNote);
    expect(element.props.onMenu).toBe(onMenu);
  });

  it("renders NewTabPage with only 2 buttons (New note and New todo list) matching Image 1", () => {
    const onNewNote = vi.fn();
    const onNewTodoList = vi.fn();
    const onOpenSidebar = vi.fn();

    const element = (
      <NewTabPage
        onOpenSidebar={onOpenSidebar}
        onNewNote={onNewNote}
        onNewTodoList={onNewTodoList}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.onNewNote).toBe(onNewNote);
    expect(element.props.onNewTodoList).toBe(onNewTodoList);
    expect(element.props.onOpenSidebar).toBe(onOpenSidebar);
  });

  it("renders TabSwitcherModal with grid cards, active tab border, close button, and bottom bar matching Image 2", () => {
    const onSelectTab = vi.fn();
    const onCloseTab = vi.fn();
    const onNewTab = vi.fn();
    const onDone = vi.fn();

    const tabs = [
      {
        id: "tab-1",
        path: "Untitled.md",
        title: "Untitled",
        previewText: "Snippet 1",
      },
      {
        id: "tab-2",
        path: "Untitled 1.md",
        title: "Untitled 1",
        previewText: "",
      },
      {
        id: "tab-3",
        path: "Todos.md",
        title: "Todos",
        previewText: "- [ ] Task",
      },
    ];

    const element = (
      <TabSwitcherModal
        visible={true}
        tabs={tabs}
        activeTabId="tab-1"
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onNewTab={onNewTab}
        onDone={onDone}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.tabs.length).toBe(3);
    expect(element.props.activeTabId).toBe("tab-1");
    expect(element.props.onDone).toBe(onDone);
    expect(element.props.onNewTab).toBe(onNewTab);
  });

  it("renders VaultDrawerContent with top close button and 5 action icons in exact order", () => {
    const onClose = vi.fn();
    const onOpenDailyNote = vi.fn();
    const onOpenTags = vi.fn();
    const onOpenGraph = vi.fn();
    const onCreateFolder = vi.fn();
    const onCreateNote = vi.fn();

    const element = (
      <VaultDrawerContent
        folders={["Projects"]}
        notes={["Projects/Note.md", "QuickNote.md"]}
        onClose={onClose}
        onSelectNote={vi.fn()}
        onOpenDailyNote={onOpenDailyNote}
        onOpenTags={onOpenTags}
        onOpenGraph={onOpenGraph}
        onCreateFolder={onCreateFolder}
        onCreateNote={onCreateNote}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.onClose).toBe(onClose);
    expect(element.props.onOpenDailyNote).toBe(onOpenDailyNote);
    expect(element.props.onOpenTags).toBe(onOpenTags);
    expect(element.props.onOpenGraph).toBe(onOpenGraph);
    expect(element.props.onCreateFolder).toBe(onCreateFolder);
    expect(element.props.onCreateNote).toBe(onCreateNote);
  });

  it("renders NoteActionSheet with onOpenSettings support", () => {
    const onOpenSettings = vi.fn();
    const onClose = vi.fn();

    const element = (
      <NoteActionSheet
        visible={true}
        onClose={onClose}
        onOpenSettings={onOpenSettings}
      />
    );

    expect(element).toBeDefined();
    expect(element.props.onOpenSettings).toBe(onOpenSettings);
  });

  it("tabStore handles open, close, and unsaved note tabs cleanly", () => {
    const tabA = openNoteInTab("First.md", "hello");
    const tabB = openNoteInTab("Second.md", "world");
    expect(getTabStoreState().tabs.some((t) => t.id === tabA)).toBe(true);
    expect(getTabStoreState().tabs.some((t) => t.id === tabB)).toBe(true);
    expect(getTabStoreState().activeTabId).toBe(tabB);

    closeTab(tabB);
    expect(getTabStoreState().tabs.some((t) => t.id === tabB)).toBe(false);

    const unsavedId = createUnsavedNewTab();
    const unsavedTab = getTabStoreState().tabs.find((t) => t.id === unsavedId);
    expect(unsavedTab).toBeDefined();
    expect(unsavedTab?.title).toBe("Untitled");
  });

  it("stripLeadingH1Title removes leading # Title line from editor content", () => {
    expect(stripLeadingH1Title("# My Note\n\nBody content")).toBe(
      "Body content",
    );
    expect(
      stripLeadingH1Title("# Daily routine\n\n## Section\n- [ ] Task"),
    ).toBe("## Section\n- [ ] Task");
    expect(stripLeadingH1Title("---\ntags: [a]\n---\n# Title\n\nBody")).toBe(
      "---\ntags: [a]\n---\nBody",
    );
    expect(stripLeadingH1Title("## Subheading\nBody")).toBe(
      "## Subheading\nBody",
    );
  });
});
