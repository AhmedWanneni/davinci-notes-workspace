import type { Meta, StoryObj } from "@storybook/react";
import { OwlIcon } from "./OwlIcon";

const meta: Meta<typeof OwlIcon> = {
  title: "Components/OwlIcon",
  component: OwlIcon,
  args: {
    size: 24,
    variant: "dark",
  },
};

export default meta;
type Story = StoryObj<typeof OwlIcon>;

export const Dark: Story = {
  args: {
    variant: "dark",
  },
};

export const Light: Story = {
  args: {
    variant: "light",
  },
};

export const Large: Story = {
  args: {
    size: 64,
  },
};
