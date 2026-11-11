import type { Meta, StoryObj } from "@storybook/react";
import { AgentLibraryBoard } from "./AgentLibraryBoard";

const meta: Meta<typeof AgentLibraryBoard> = {
  title: "Components/AgentLibraryBoard",
  component: AgentLibraryBoard,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AgentLibraryBoard>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: "100%", height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};
