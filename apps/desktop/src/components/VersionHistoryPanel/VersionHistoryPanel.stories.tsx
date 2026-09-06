import type { Meta, StoryObj } from "@storybook/react";
import { VersionHistoryPanel } from "./VersionHistoryPanel";

const meta = {
  title: "Components/VersionHistoryPanel",
  component: VersionHistoryPanel,
  args: {
    activePath: null,
    onRestored: () => {},
  },
} satisfies Meta<typeof VersionHistoryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MarkdownOnly: Story = {};
