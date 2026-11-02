import type { Meta, StoryObj } from "@storybook/react";
import { ListeningVisualizer } from "./ListeningVisualizer";

const meta: Meta<typeof ListeningVisualizer> = {
  title: "ListeningView/ListeningVisualizer",
  component: ListeningVisualizer,
};

export default meta;
type Story = StoryObj<typeof ListeningVisualizer>;

export const Idle: Story = {
  args: {
    status: "idle",
    title: "Sprint Planning",
    durationMs: 0,
    micLevel: 0,
    systemLevel: 0,
    isTranscriptVisible: false,
    isAIListeningActive: false,
  },
};

export const Recording: Story = {
  args: {
    status: "recording",
    title: "Quarterly Roadmap Review",
    durationMs: 72000,
    micLevel: 0.65,
    systemLevel: 0.3,
    isTranscriptVisible: true,
    isAIListeningActive: true,
  },
};
