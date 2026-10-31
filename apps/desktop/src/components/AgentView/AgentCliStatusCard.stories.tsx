import type { Meta, StoryObj } from "@storybook/react";
import { AgentCliStatusCard } from "./AgentCliStatusCard";

const meta: Meta<typeof AgentCliStatusCard> = {
  title: "AgentView/AgentCliStatusCard",
  component: AgentCliStatusCard,
};

export default meta;
type Story = StoryObj<typeof AgentCliStatusCard>;

export const Running: Story = {
  args: {
    agentName: "Antigravity CLI (agy)",
    status: "running",
    logs: [
      "⚡ Scanning vault tree (found 42 markdown files)...",
      "Moving 8 meeting notes into 'Projects/Sprint-42/'...",
      "Writing 'Projects/Sprint-42/Roadmap.md' with Mermaid Gantt...",
    ],
    onCancel: () => console.log("Cancel clicked"),
  },
};

export const Completed: Story = {
  args: {
    agentName: "Claude Code",
    status: "done",
    logs: [
      "Reading note structure...",
      "Refactored 4 tags into frontmatter.",
      "Execution completed.",
    ],
  },
};

export const ErrorState: Story = {
  args: {
    agentName: "Codex CLI",
    status: "error",
    logs: [
      "Failed to find binary codex in system PATH.",
      "Process exited with error.",
    ],
  },
};
