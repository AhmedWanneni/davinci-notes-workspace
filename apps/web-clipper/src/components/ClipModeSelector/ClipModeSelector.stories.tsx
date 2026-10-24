import type { Meta, StoryObj } from "@storybook/react";
import { ClipModeSelector } from "./ClipModeSelector";

const meta: Meta<typeof ClipModeSelector> = {
  title: "Web Clipper/ClipModeSelector",
  component: ClipModeSelector,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ClipModeSelector>;

export const Default: Story = {
  args: {
    mode: "full",
    onChange: (mode) => console.log("Clip mode:", mode),
  },
};

export const FullPage: Story = {
  args: {
    mode: "full",
    onChange: () => {},
  },
};

export const Selection: Story = {
  args: {
    mode: "selection",
    onChange: () => {},
  },
};

export const NothingToClip: Story = {
  args: {
    mode: "full",
    onChange: () => {},
    disabledModes: ["selection", "highlights"],
  },
};
