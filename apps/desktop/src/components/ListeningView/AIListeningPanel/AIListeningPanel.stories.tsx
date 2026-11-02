import type { Meta, StoryObj } from "@storybook/react";
import { AIListeningPanel } from "./AIListeningPanel";

const meta: Meta<typeof AIListeningPanel> = {
  title: "ListeningView/AIListeningPanel",
  component: AIListeningPanel,
};

export default meta;
type Story = StoryObj<typeof AIListeningPanel>;

export const Default: Story = {
  args: {
    summary:
      "The team agreed on the Cloudflare deployment schedule and prioritized regression tests.",
    answers: [
      {
        id: "a1",
        timestamp: Date.now() - 60000,
        question: "When will the build deploy?",
        answer: "By 5 PM today.",
        status: "suggested",
      },
    ],
    questions: [
      {
        id: "q1",
        timestamp: Date.now() - 30000,
        question: "Who is responsible for the final sign-off?",
        status: "suggested",
      },
    ],
    isStreaming: false,
    channelName: "Voice Agent Meetings",
  },
};
