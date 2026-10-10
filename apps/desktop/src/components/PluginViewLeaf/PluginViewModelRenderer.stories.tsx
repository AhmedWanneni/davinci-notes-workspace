import type { Meta, StoryObj } from "@storybook/react";
import { PluginViewModelRenderer } from "./PluginViewModelRenderer";

const meta = {
  title: "Plugins/Declarative View",
  component: PluginViewModelRenderer,
  args: {
    model: {
      type: "stack",
      children: [
        { type: "text", text: "Count: 0" },
        { type: "button", id: "increment", label: "Increment" },
      ],
    },
    onEvent: () => {},
  },
} satisfies Meta<typeof PluginViewModelRenderer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Counter: Story = {};
