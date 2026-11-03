import type { Meta, StoryObj } from "@storybook/react";
import { WebBookmarkAddBar } from "./WebBookmarkAddBar";

const meta: Meta<typeof WebBookmarkAddBar> = {
  title: "Components/Bookmarks/WebBookmarkAddBar",
  component: WebBookmarkAddBar,
  parameters: {
    layout: "padded",
  },
  args: {
    onAdd: () => {},
    onAddBatch: () => {},
    onCancel: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof WebBookmarkAddBar>;

export const ManualMode: Story = {
  args: {
    initialMode: "manual",
  },
};

export const BrowserMode: Story = {
  args: {
    initialMode: "browser",
  },
};
