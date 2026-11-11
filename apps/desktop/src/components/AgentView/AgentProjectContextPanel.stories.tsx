import type { Meta, StoryObj } from "@storybook/react";
import { AgentProjectContextPanel } from "./AgentProjectContextPanel";

const meta: Meta<typeof AgentProjectContextPanel> = {
  title: "Components/AgentProjectContextPanel",
  component: AgentProjectContextPanel,
};

export default meta;
type Story = StoryObj<typeof AgentProjectContextPanel>;

export const Default: Story = {
  args: {
    projectId: "proj-sample",
    sources: [
      "Context of obsidian tauri app.md",
      "Architecture/Database.md",
      "Guidelines/Rules.md",
    ],
    vaultNotes: [
      "Context of obsidian tauri app.md",
      "Architecture/Database.md",
      "Guidelines/Rules.md",
      "Ideas/Roadmap.md",
    ],
    onAddSource: () => {},
    onRemoveSource: () => {},
  },
};
