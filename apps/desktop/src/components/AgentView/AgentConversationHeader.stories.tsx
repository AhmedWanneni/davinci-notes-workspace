import type { Meta, StoryObj } from "@storybook/react";
import { AgentConversationHeader } from "./AgentConversationHeader";

const meta: Meta<typeof AgentConversationHeader> = {
  title: "Components/AgentConversationHeader",
  component: AgentConversationHeader,
};

export default meta;
type Story = StoryObj<typeof AgentConversationHeader>;

export const InProject: Story = {
  args: {
    title: "Obsidian tauri app",
    projectName: "Obsidian tauri app",
    projectId: "proj-1",
    onNavigateProject: () => {},
    onRename: () => {},
    onDelete: () => {},
  },
};

export const Standalone: Story = {
  args: {
    title: "Audio transcription tools",
    onRename: () => {},
    onDelete: () => {},
  },
};
