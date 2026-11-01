import type { Meta, StoryObj } from "@storybook/react";
import { AgentSidebarPanel } from "./AgentSidebarPanel";

const meta: Meta<typeof AgentSidebarPanel> = {
  title: "Components/AgentSidebarPanel",
  component: AgentSidebarPanel,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AgentSidebarPanel>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 260, height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};
