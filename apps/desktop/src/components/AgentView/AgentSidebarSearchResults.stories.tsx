import type { Meta, StoryObj } from "@storybook/react";
import { AgentSidebarSearchResults } from "./AgentSidebarSearchResults";

const meta: Meta<typeof AgentSidebarSearchResults> = {
  title: "Components/AgentSidebarSearchResults",
  component: AgentSidebarSearchResults,
};

export default meta;
type Story = StoryObj<typeof AgentSidebarSearchResults>;

export const Matches: Story = {
  args: {
    query: "Syncthing",
    conversations: [
      {
        id: "c-1",
        title: "Release automation plan",
        projectId: "p-mobile",
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now(),
        messages: [
          {
            id: "m-1",
            role: "assistant",
            content:
              "We verified that the Syncthing native binary runs without errors on Android.",
            timestamp: Date.now(),
          },
        ],
      },
    ],
    projects: [{ id: "p-mobile", name: "Mobile", createdAt: Date.now() }],
    activeConversationId: null,
    onSelectConversation: () => {},
  },
};

export const Empty: Story = {
  args: {
    query: "Quantum Computing",
    conversations: [],
    projects: [],
    activeConversationId: null,
    onSelectConversation: () => {},
  },
};
