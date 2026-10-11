import type { Meta, StoryObj } from "@storybook/react";
import { QuickCapture } from "./QuickCapture";

const meta: Meta<typeof QuickCapture> = {
  title: "Components/QuickCapture",
  component: QuickCapture,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof QuickCapture>;

export const Default: Story = {
  args: {
    onSave: async (text: string) => {
      console.log("Saved capture:", text);
    },
    onDismiss: async () => {
      console.log("Dismissed capture");
    },
  },
};

export const WithError: Story = {
  args: {
    onSave: async () => {
      throw new Error("No vault open. Please open a vault first.");
    },
    onDismiss: async () => {
      console.log("Dismissed capture");
    },
  },
};
