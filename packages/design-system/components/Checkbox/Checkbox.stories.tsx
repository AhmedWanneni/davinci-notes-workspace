import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Checkbox } from "./Checkbox";
import { Typography } from "../Typography";

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultChecked: false,
  },
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Checkbox id="c1" {...args} />
      <label htmlFor="c1" style={{ cursor: "pointer" }}>
        <Typography size="sm">Accept terms and conditions</Typography>
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");
    await expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
    await userEvent.keyboard("{Space}");
    await expect(checkbox).not.toBeChecked();
  },
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
  render: Default.render,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Checkbox id="c2" {...args} />
      <label htmlFor="c2" style={{ cursor: "not-allowed", opacity: 0.5 }}>
        <Typography size="sm">Disabled checkbox</Typography>
      </label>
    </div>
  ),
};
