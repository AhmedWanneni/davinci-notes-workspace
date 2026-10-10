import type { Meta, StoryObj } from "@storybook/react";
import { FileTreeToolbar } from "./FileTreeToolbar";

const meta = {
  title: "Components/FileTreeToolbar",
  component: FileTreeToolbar,
} satisfies Meta<typeof FileTreeToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onCreateNote: () => undefined,
    onCreateFolder: () => undefined,
    sortOrder: "name-asc",
    onToggleSort: () => undefined,
    onCollapseAll: () => undefined,
    onExpandAll: () => undefined,
  },
};

export const SortDescending: Story = {
  args: {
    onCreateNote: () => undefined,
    onCreateFolder: () => undefined,
    sortOrder: "name-desc",
    onToggleSort: () => undefined,
    onCollapseAll: () => undefined,
    onExpandAll: () => undefined,
  },
};
