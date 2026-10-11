import type { Meta, StoryObj } from "@storybook/react";
import { QuickCapture } from "./QuickCapture";

const meta: Meta<typeof QuickCapture> = {
  title: "Components/QuickCapture",
  component: QuickCapture,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof QuickCapture>;

export const Default: Story = {
  args: {
    onSave: async (text: string) => {
      console.log("Saved capture:", text);
    },
    onDismiss: async () => {
      console.log("Dismissed capture");
    },
  },
};

export const WithError: Story = {
  args: {
    onSave: async () => {
      throw new Error("No vault open. Please open a vault first.");
    },
    onDismiss: async () => {
      console.log("Dismissed capture");
    },
  },
};

export const SearchMode: Story = {
  args: {
    initialMode: "search",
    searchFn: async (query: string) => [
      {
        path: "projects/alpha.md",
        title: "Alpha Project Plan",
        mtime: 1700000000,
        score: -5.2,
      },
      {
        path: "Inbox.md",
        title: "Inbox",
        mtime: 1700000010,
        score: -4.1,
      },
      {
        path: "work/meetings/weekly-sync.md",
        title: `Meeting Notes for ${query}`,
        mtime: 1700000020,
        score: -3.0,
      },
    ],
  },
};

export const SearchModeEmptyResults: Story = {
  args: {
    initialMode: "search",
    searchFn: async () => [],
  },
};
