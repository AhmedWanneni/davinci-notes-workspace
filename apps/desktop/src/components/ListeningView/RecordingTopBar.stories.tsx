import type { Meta, StoryObj } from "@storybook/react";
import { RecordingTopBar } from "./RecordingTopBar";

const meta: Meta<typeof RecordingTopBar> = {
  title: "ListeningView/RecordingTopBar",
  component: RecordingTopBar,
};

export default meta;
type Story = StoryObj<typeof RecordingTopBar>;

export const Default: Story = {
  args: {},
};
