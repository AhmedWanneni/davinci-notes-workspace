import type { Meta, StoryObj } from "@storybook/react";
import { VisualizerControls } from "./VisualizerControls";

const meta: Meta<typeof VisualizerControls> = {
  title: "ListeningView/VisualizerControls",
  component: VisualizerControls,
};

export default meta;
type Story = StoryObj<typeof VisualizerControls>;

export const Idle: Story = {
  args: {
    status: "idle",
    isRecording: false,
    isPaused: false,
    isLive: false,
  },
};

export const Recording: Story = {
  args: {
    status: "recording",
    isRecording: true,
    isPaused: false,
    isLive: true,
  },
};

export const Paused: Story = {
  args: {
    status: "paused",
    isRecording: false,
    isPaused: true,
    isLive: true,
  },
};
