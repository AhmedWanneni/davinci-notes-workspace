import type { Meta, StoryObj } from "@storybook/react";
import { AgentSaveNoteModal } from "./AgentSaveNoteModal";

const meta: Meta<typeof AgentSaveNoteModal> = {
  title: "AgentView/AgentSaveNoteModal",
  component: AgentSaveNoteModal,
};

export default meta;
type Story = StoryObj<typeof AgentSaveNoteModal>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log("onClose"),
    content: "### Sprint Goals\n- Feature A\n- Feature B",
  },
};
