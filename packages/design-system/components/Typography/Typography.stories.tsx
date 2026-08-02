import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import { Typography } from "./Typography";

const meta = {
  title: "Primitives/Typography",
  component: Typography,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["h1", "h2", "h3", "h4", "text", "editor"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "base", "lg", "xl", "2xl"],
    },
    weight: {
      control: "select",
      options: ["regular", "medium", "semibold", "bold"],
    },
    color: {
      control: "select",
      options: ["normal", "muted", "faint", "accent", "error"],
    },
  },
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "The quick brown fox jumps over the lazy dog",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText("The quick brown fox jumps over the lazy dog"),
    ).toBeInTheDocument();
  },
};

export const Headings: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Typography variant="h1">Heading 1</Typography>
      <Typography variant="h2">Heading 2</Typography>
      <Typography variant="h3">Heading 3</Typography>
      <Typography variant="h4">Heading 4</Typography>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <Typography color="normal">Normal Text</Typography>
      <Typography color="muted">Muted Text</Typography>
      <Typography color="faint">Faint Text</Typography>
      <Typography color="accent">Accent Text</Typography>
      <Typography color="error">Error Text</Typography>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <Typography size="xs">Extra Small Text (xs)</Typography>
      <Typography size="sm">Small Text (sm)</Typography>
      <Typography size="base">Base Text (base)</Typography>
      <Typography size="lg">Large Text (lg)</Typography>
    </div>
  ),
};

export const Editor: Story = {
  args: {
    variant: "editor",
    children: "This text uses the monospaced editor font.",
  },
};

export const AsChild: Story = {
  args: {
    asChild: true,
    color: "accent",
    weight: "bold",
    children: (
      <a href="https://example.com">I am a link rendered as an anchor tag</a>
    ),
  },
};
