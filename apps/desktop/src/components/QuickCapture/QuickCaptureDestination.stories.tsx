import type { Meta, StoryObj } from "@storybook/react";
import { QuickCaptureDestination } from "./QuickCaptureDestination";

const meta: Meta<typeof QuickCaptureDestination> = {
  title: "Components/QuickCaptureDestination",
  component: QuickCaptureDestination,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof QuickCaptureDestination>;

export const Default: Story = {
  args: {
    filename: "",
    onFilenameChange: () => {},
    folder: "",
    onFolderChange: () => {},
    onSave: () => {},
    onDismiss: () => {},
  },
};

export const Populated: Story = {
  args: {
    filename: "Sprint Review Notes",
    onFilenameChange: () => {},
    folder: "work/reviews",
    onFolderChange: () => {},
    onSave: () => {},
    onDismiss: () => {},
  },
};
