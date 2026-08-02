import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { Divider } from "./Divider";
import { Typography } from "../Typography";

const meta = {
  title: "Primitives/Divider",
  component: Divider,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["normal", "strong"],
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div style={{ width: "300px" }}>
      <Typography variant="h4">Section One</Typography>
      <Typography size="sm" color="muted">
        Some text content goes here.
      </Typography>
      <Divider style={{ margin: "16px 0" }} {...args} />
      <Typography variant="h4">Section Two</Typography>
      <Typography size="sm" color="muted">
        More text content down here.
      </Typography>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("separator")).toBeInTheDocument();
    await expect(canvas.getByText("Section One")).toBeInTheDocument();
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
  render: (args) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "40px",
        gap: "16px",
      }}
    >
      <Typography size="sm">Option 1</Typography>
      <Divider {...args} />
      <Typography size="sm">Option 2</Typography>
      <Divider {...args} />
      <Typography size="sm">Option 3</Typography>
    </div>
  ),
};

export const Strong: Story = {
  args: {
    variant: "strong",
  },
  render: Horizontal.render,
};
