import type { Meta, StoryObj } from "@storybook/react";
import { MeetingAgentChatFeed } from "./MeetingAgentChatFeed";

const meta: Meta<typeof MeetingAgentChatFeed> = {
  title: "ListeningView/MeetingAgentChatFeed",
  component: MeetingAgentChatFeed,
};

export default meta;
type Story = StoryObj<typeof MeetingAgentChatFeed>;

export const Empty: Story = {
  args: {
    messages: [],
    isExecuting: false,
    conversationId: "conv_meet_1",
  },
};

export const WithMessages: Story = {
  args: {
    messages: [
      {
        id: "msg_1",
        role: "user",
        content: "What did we decide about database locking?",
        timestamp: Date.now() - 60000,
      },
      {
        id: "msg_2",
        role: "assistant",
        content: "We agreed to apply ADR-0168 universal write locking discipline under withDbLock.",
        timestamp: Date.now() - 30000,
        toolCalls: [
          {
            id: "call_1",
            tool: "search_vault",
            args: { query: "locking" },
            result: "ADR-0168",
          },
        ],
      },
    ],
    isExecuting: false,
    conversationId: "conv_meet_1",
  },
};
