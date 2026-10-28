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
      webBookmarks: [
        {
          id: "w1",
          url: "https://v2.tauri.app/start/",
          title: "Tauri 2.0 Documentation",
          domain: "v2.tauri.app",
          folder: "Development",
          tags: ["rust", "desktop"],
          description: "Build smaller, faster, and more secure desktop and mobile applications.",
          addedAt: Date.now() - 1800000,
        },
        {
          id: "w2",
          url: "https://arxiv.org/abs/2303.08774",
          title: "Attention & Reasoning in Local Models",
          domain: "arxiv.org",
          folder: "AI & Research",
          tags: ["ai", "papers"],
          addedAt: Date.now() - 5400000,
        },
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

export const WebLinksPage: Story = {
  args: {
    initialPage: "links",
  },
  beforeEach: () => {
    useBookmarkStore.setState({
      isLoaded: true,
      bookmarks: [{ path: "Notes/Architecture.md", addedAt: Date.now() }],
      webBookmarks: [
        {
          id: "w1",
          url: "https://v2.tauri.app/start/",
          title: "Tauri 2.0 Documentation",
          domain: "v2.tauri.app",
          folder: "Development",
          tags: ["rust", "desktop"],
          description: "Build smaller, faster, and more secure desktop and mobile applications.",
          addedAt: Date.now() - 1800000,
        },
        {
          id: "w2",
          url: "https://arxiv.org/abs/2303.08774",
          title: "Attention & Reasoning in Local Models",
          domain: "arxiv.org",
          folder: "AI & Research",
          tags: ["ai", "papers"],
          addedAt: Date.now() - 5400000,
        },
        {
          id: "w3",
          url: "https://news.ycombinator.com",
          title: "Hacker News",
          domain: "news.ycombinator.com",
          addedAt: Date.now() - 9000000,
        },
      ],
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
      webBookmarks: [],
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
      webBookmarks: [],
    });
    useWorkspaceStore.setState({
      allNotePaths: [],
    });
  },
};
