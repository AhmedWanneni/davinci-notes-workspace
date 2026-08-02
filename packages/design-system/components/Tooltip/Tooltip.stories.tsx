import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { Tooltip, TooltipProvider } from "./Tooltip";
import { Button } from "../Button";
import { Plus } from "@phosphor-icons/react";

const meta = {
  title: "Primitives/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: "Add to library",
    children: (
      <Button variant="secondary" size="icon" aria-label="Add">
        <Plus size={16} />
      </Button>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Add" });
    await userEvent.hover(trigger);
    await waitFor(() => {
      expect(within(document.body).getByRole("tooltip")).toHaveTextContent(
        "Add to library",
      );
    });
  },
};

export const Positions: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "32px" }}>
      <Tooltip content="Top tooltip" contentProps={{ side: "top" }}>
        <Button variant="secondary">Top</Button>
      </Tooltip>
      <Tooltip content="Right tooltip" contentProps={{ side: "right" }}>
        <Button variant="secondary">Right</Button>
      </Tooltip>
      <Tooltip content="Bottom tooltip" contentProps={{ side: "bottom" }}>
        <Button variant="secondary">Bottom</Button>
      </Tooltip>
      <Tooltip content="Left tooltip" contentProps={{ side: "left" }}>
        <Button variant="secondary">Left</Button>
      </Tooltip>
    </div>
  ),
};
