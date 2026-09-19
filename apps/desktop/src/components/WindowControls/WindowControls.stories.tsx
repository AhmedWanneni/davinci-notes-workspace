import type { Meta, StoryObj } from "@storybook/react";
import { WindowControls } from "./WindowControls";

const meta = {
  title: "Components/WindowControls",
  component: WindowControls,
} satisfies Meta<typeof WindowControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
