import type { Meta, StoryObj } from "@storybook/react";
import { RecordAgentPicker } from "./RecordAgentPicker";

const meta: Meta<typeof RecordAgentPicker> = {
  title: "ListeningView/RecordAgentPicker",
  component: RecordAgentPicker,
};

export default meta;
type Story = StoryObj<typeof RecordAgentPicker>;

export const Default: Story = {};
