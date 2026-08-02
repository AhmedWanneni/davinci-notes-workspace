import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Toggle } from "./Toggle";
import { Typography } from "../Typography";

const meta = {
  title: "Primitives/Toggle",
  component: Toggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultChecked: false,
  },
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <Toggle id="t1" {...args} />
      <label htmlFor="t1" style={{ cursor: "pointer" }}>
        <Typography size="sm">Enable notifications</Typography>
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("switch");
    await expect(toggle).toHaveAttribute("data-state", "unchecked");
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute("data-state", "checked");
    await userEvent.keyboard("{Space}");
    await expect(toggle).toHaveAttribute("data-state", "unchecked");
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
      <Toggle id="t2" {...args} />
      <label htmlFor="t2" style={{ cursor: "not-allowed", opacity: 0.5 }}>
        <Typography size="sm">Disabled setting</Typography>
      </label>
    </div>
  ),
};
