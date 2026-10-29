import type { Meta, StoryObj } from "@storybook/react";
import { VaultSwitcher } from "./VaultSwitcher";

const meta: Meta<typeof VaultSwitcher> = {
  title: "Components/VaultSwitcher",
  component: VaultSwitcher,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof VaultSwitcher>;

export const Default: Story = {
  args: {
    vaultName: "Personal Notes",
    vaultPath: "/Users/demo/Personal Notes",
    onOpenSettings: () => console.log("Open settings"),
    onOpenHelp: () => console.log("Open help"),
    onSwitchVault: async (path: string) => console.log("Switch to:", path),
    onOpenFolderPicker: async () => console.log("Pick folder"),
    onCreateNewVault: async () => console.log("Create vault"),
  },
  render: (args) => (
    <div style={{ width: 270, backgroundColor: "var(--color-bg-primary-alt)" }}>
      <VaultSwitcher {...args} />
    </div>
  ),
};

export const WithDriveSyncAndOpen: Story = {
  args: {
    vaultName: "Personal Notes",
    vaultPath: "/Users/demo/Personal Notes",
    onOpenSettings: () => console.log("Open settings"),
    onOpenHelp: () => console.log("Open help"),
    onSwitchVault: async (path: string) => console.log("Switch to:", path),
    onOpenFolderPicker: async () => console.log("Pick folder"),
    onCreateNewVault: async () => console.log("Create vault"),
    onOpenVaultFromDrive: async () => console.log("Open from Drive"),
    onSyncVault: async () => console.log("Sync now"),
  },
  render: (args) => (
    <div style={{ width: 270, backgroundColor: "var(--color-bg-primary-alt)" }}>
      <VaultSwitcher {...args} />
    </div>
  ),
};
