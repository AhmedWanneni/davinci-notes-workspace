import type { Meta, StoryObj } from "@storybook/react";
import { AgentLibraryCard } from "./AgentLibraryCard";

const meta: Meta<typeof AgentLibraryCard> = {
  title: "Components/AgentLibraryCard",
  component: AgentLibraryCard,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof AgentLibraryCard>;

export const PromptCard: Story = {
  args: {
    item: {
      id: "story-1",
      type: "prompt",
      title: "Synthesize Wiki Note",
      description:
        "Generates an interconnected wiki concept note using Obsidian wikilinks.",
      content:
        "Review all notes and synthesize them into a wiki note with [[Wikilinks]].",
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
    },
    projectName: "General",
    isSelected: false,
    onToggleSelect: () => {},
    onUseInPrompt: () => {},
    onEdit: () => {},
    onDelete: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
};

export const SkillCardSelected: Story = {
  args: {
    item: {
      id: "story-2",
      type: "skill",
      title: "Meeting Actions Extractor",
      description: "Extract tasks, assignees, and target completion dates.",
      content: "Extract markdown action items table from meeting transcript.",
      createdAt: Date.now() - 86400000 * 3,
      updatedAt: Date.now() - 86400000 * 3,
    },
    projectName: "Work",
    isSelected: true,
    onToggleSelect: () => {},
    onUseInPrompt: () => {},
    onEdit: () => {},
    onDelete: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
};

export const RuleCard: Story = {
  args: {
    item: {
      id: "story-3",
      type: "rule",
      title: "Concise Bulleted Communication",
      description:
        "Eliminate preamble, polite filler, and generic conversational text.",
      content: "Respond strictly with bullet points.",
      createdAt: Date.now() - 86400000 * 7,
      updatedAt: Date.now() - 86400000 * 7,
    },
    projectName: "Engineering",
    isSelected: false,
    onToggleSelect: () => {},
    onUseInPrompt: () => {},
    onEdit: () => {},
    onDelete: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
};
