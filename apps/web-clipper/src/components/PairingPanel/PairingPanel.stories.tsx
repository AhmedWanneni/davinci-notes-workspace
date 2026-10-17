import type { Meta, StoryObj } from "@storybook/react";
import type { PairingSettingsController } from "../../pairing/usePairingSettings";
import { PairingPanel } from "./PairingPanel";

const meta: Meta<typeof PairingPanel> = {
  title: "Web Clipper/PairingPanel",
  component: PairingPanel,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof PairingPanel>;

function controller(
  overrides: Partial<PairingSettingsController> = {},
): PairingSettingsController {
  return {
    loading: false,
    paired: false,
    port: "47912",
    token: "",
    saving: false,
    setPort: (value) => console.log("Port:", value),
    setToken: (value) => console.log("Token:", value),
    save: () => console.log("Save pairing"),
    clear: () => console.log("Forget pairing"),
    ...overrides,
  };
}

export const Unpaired: Story = { args: { controller: controller() } };

export const Paired: Story = {
  args: {
    controller: controller({
      paired: true,
      token: "0f8c1a5e-2b7d-4a90-9c3f-1d2e3f4a5b6c",
      notice: "Pairing saved. Clips now go straight to your vault.",
    }),
  },
};

export const InvalidInput: Story = {
  args: {
    controller: controller({
      port: "99999",
      portError: "Enter the port DaVinci Notes shows, for example 47912.",
      tokenError: "Paste the pairing token from DaVinci Notes.",
    }),
  },
};

export const SaveFailed: Story = {
  args: {
    controller: controller({
      error: "The pairing could not be saved. Try again.",
    }),
  },
};

export const Loading: Story = {
  args: { controller: controller({ loading: true }) },
};
