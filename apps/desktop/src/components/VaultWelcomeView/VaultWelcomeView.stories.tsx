import type { Meta, StoryObj } from "@storybook/react";
import { VaultWelcomeView } from "./VaultWelcomeView";

const meta: Meta<typeof VaultWelcomeView> = {
  title: "Components/VaultWelcomeView",
  component: VaultWelcomeView,
  tags: ["autodocs"],
  args: {
    isLoadingVault: false,
    vaultError: null,
    recentVaults: [
      {
        name: "Personal Notes",
        path: "/Users/davinci/Documents/Personal",
        lastOpenedAt: Date.now() - 1000 * 60 * 15,
        exists: true,
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof VaultWelcomeView>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    isLoadingVault: true,
  },
};

export const WithError: Story = {
  args: {
    vaultError: "The selected folder does not have read permissions.",
  },
};

export const FirstLaunchNoRecents: Story = {
  args: {
    recentVaults: [],
    onOpenVaultFromDrive: () => console.log("Open from Drive"),
  },
};
