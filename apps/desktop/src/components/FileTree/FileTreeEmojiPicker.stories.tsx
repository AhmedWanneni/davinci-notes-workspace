import type { Meta, StoryObj } from "@storybook/react";
import { FileTreeEmojiPicker } from "./FileTreeEmojiPicker";

const meta = {
  title: "Components/FileTreeEmojiPicker",
  component: FileTreeEmojiPicker,
} satisfies Meta<typeof FileTreeEmojiPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSelect: () => undefined,
    onClose: () => undefined,
  },
};
