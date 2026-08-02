import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { Badge } from "./Badge";
import { Star } from "@phosphor-icons/react";

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["neutral", "accent", "success", "warning", "error"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: {
    variant: "neutral",
    children: "Neutral",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Neutral")).toBeInTheDocument();
  },
};

export const Accent: Story = {
  args: {
    variant: "accent",
    children: "Accent",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Success",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Warning",
  },
};

export const ErrorVariant: Story = {
  args: {
    variant: "error",
    children: "Error",
  },
};

export const WithIcon: Story = {
  args: {
    variant: "accent",
    icon: <Star size={12} weight="bold" />,
    children: "Starred",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <Badge variant="neutral">Draft</Badge>
      <Badge variant="accent">New</Badge>
      <Badge variant="success">Published</Badge>
      <Badge variant="warning">Archived</Badge>
      <Badge variant="error">Failed</Badge>
    </div>
  ),
};
