import type { Meta, StoryObj } from "@storybook/react";
import { WindowDialog } from "./WindowDialog";

const meta: Meta<typeof WindowDialog> = {
  title: "Components/WindowDialog",
  component: WindowDialog,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof WindowDialog>;

export const Default: Story = {
  args: {
    isOpen: true,
    title: "Document Settings",
    size: "md",
    children: (
      <div style={{ padding: 16 }}>
        <p>This is a canonical desktop window dialog.</p>
      </div>
    ),
  },
};

export const SmallWithFooter: Story = {
  args: {
    isOpen: true,
    title: "Confirm Action",
    size: "sm",
    footer: (
      <>
        <button type="button">Cancel</button>
        <button type="button">Delete</button>
      </>
    ),
    children: (
      <div style={{ padding: 16 }}>
        <p>Are you sure you want to proceed?</p>
      </div>
    ),
  },
};
