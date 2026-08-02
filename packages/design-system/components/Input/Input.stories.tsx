import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { Input } from "./Input";
import { MagnifyingGlass, Envelope } from "@phosphor-icons/react";

const meta = {
  title: "Primitives/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    disabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Enter text...");
    await userEvent.click(input);
    await expect(input).toHaveFocus();
    await userEvent.type(input, "Hello");
    await expect(input).toHaveValue("Hello");
  },
};

export const Sizes: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "300px",
      }}
    >
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "300px",
      }}
    >
      <Input placeholder="Default input" />
      <Input variant="error" placeholder="Error input" />
    </div>
  ),
};

export const WithPrefixAndSuffix: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "300px",
      }}
    >
      <Input prefix={<MagnifyingGlass size={16} />} placeholder="Search..." />
      <Input
        suffix={<Envelope size={16} />}
        placeholder="Email address"
        type="email"
      />
      <Input
        prefix={<MagnifyingGlass size={16} />}
        suffix={
          <div
            style={{
              fontSize: "12px",
              background: "var(--color-bg-secondary)",
              padding: "2px 4px",
              borderRadius: "4px",
            }}
          >
            ⌘K
          </div>
        }
        placeholder="Quick search"
      />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Disabled input",
    value: "Uneditable value",
  },
};
