import type { Meta, StoryObj } from "@storybook/react";
import { AgentAvailabilityBanner } from "./AgentAvailabilityBanner";

const meta: Meta<typeof AgentAvailabilityBanner> = {
  title: "AgentView/AgentAvailabilityBanner",
  component: AgentAvailabilityBanner,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AgentAvailabilityBanner>;

export const CliAgentUnavailable: Story = {
  args: {
    providerId: "gemini",
    selectedCliAgent: "codex",
    onOpenSettings: () => {},
  },
};

export const CloudProviderUnavailable: Story = {
  args: {
    providerId: "gemini",
    selectedCliAgent: null,
    onOpenSettings: () => {},
  },
};
