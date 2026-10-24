import type { Meta, StoryObj } from "@storybook/react";
import { SyncthingQrPairingSection } from "./SyncthingQrPairingSection";

const meta: Meta<typeof SyncthingQrPairingSection> = {
  title: "Components/SyncthingPanel/SyncthingQrPairingSection",
  component: SyncthingQrPairingSection,
};

export default meta;
type Story = StoryObj<typeof SyncthingQrPairingSection>;

export const ActiveWindow: Story = {
  args: {
    qrDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    pairingCode: "482910",
    secondsLeft: 285,
    isExpired: false,
    isGenerating: false,
    onRotateCode: () => {},
  },
};

export const ExpiredWindow: Story = {
  args: {
    qrDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    pairingCode: "482910",
    secondsLeft: 0,
    isExpired: true,
    isGenerating: false,
    onRotateCode: () => {},
  },
};

export const RotatingCode: Story = {
  args: {
    qrDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    pairingCode: "482910",
    secondsLeft: 300,
    isExpired: false,
    isGenerating: true,
    onRotateCode: () => {},
  },
};
