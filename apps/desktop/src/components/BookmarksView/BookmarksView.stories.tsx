import type { Meta, StoryObj } from "@storybook/react";
import { BookmarksView } from "./BookmarksView";
import { useBookmarkStore } from "../../bookmarks/bookmarkStore";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

const meta: Meta<typeof BookmarksView> = {
  title: "Views/BookmarksView",
  component: BookmarksView,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onOpenNote: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof BookmarksView>;

export const Default: Story = {
  beforeEach: () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [
        { path: "Notes/Architecture.md", addedAt: Date.now() - 3600000 },
        { path: "Projects/Q4 Roadmap.md", addedAt: Date.now() - 7200000 },
        { path: "Daily Notes/2026-10-25.md", addedAt: Date.now() - 86400000 },
        { path: "Ideas/Offline Sync.md", addedAt: Date.now() - 172800000 },
      ],
    });
    useWorkspaceStore.setState({
      allNotePaths: [
        "Notes/Architecture.md",
        "Projects/Q4 Roadmap.md",
        "Daily Notes/2026-10-25.md",
        "Ideas/Offline Sync.md",
      ],
      notesContent: {
        "Notes/Architecture.md": "# Architecture\n\nLocal-first design system with CUBE CSS tokens.",
        "Projects/Q4 Roadmap.md": "# Q4 Roadmap\n\nShipping the mobile app and Bookmarks feature.",
      },
    });
  },
};

export const WithMissingNotes: Story = {
  beforeEach: () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [
        { path: "Notes/Existing.md", addedAt: Date.now() - 3600000 },
        {
          path: "Deleted/Missing Note.md",
          addedAt: Date.now() - 86400000,
          missing: true,
        },
      ],
    });
    useWorkspaceStore.setState({
      allNotePaths: ["Notes/Existing.md"],
    });
  },
};

export const Empty: Story = {
  beforeEach: () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [],
    });
    useWorkspaceStore.setState({
      allNotePaths: [],
    });
  },
};
