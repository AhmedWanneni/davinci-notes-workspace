import type { Meta, StoryObj } from "@storybook/react";
import { EditorMenuBar } from "./EditorMenuBar";

const meta: Meta<typeof EditorMenuBar> = {
  title: "Components/EditorArea/EditorMenuBar",
  component: EditorMenuBar,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof EditorMenuBar>;

export const Default: Story = {
  args: {
    view: null,
    isFormattingToolbarVisible: false,
  },
};

export const ToolbarActive: Story = {
  args: {
    view: null,
    isFormattingToolbarVisible: true,
  },
};
