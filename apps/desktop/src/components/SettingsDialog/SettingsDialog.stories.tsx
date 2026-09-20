import type { Meta, StoryObj } from "@storybook/react";
import { SettingsDialog } from "./SettingsDialog";

const meta: Meta<typeof SettingsDialog> = {
  title: "Components/SettingsDialog",
  component: SettingsDialog,
  tags: ["autodocs"],
  args: {
    isOpen: true,
    onOpenChange: () => {},
    vaultPath: "/Users/davinci/Documents/Obsidian Vault",
    onVaultSwitched: () => {},
    themes: [
      {
        id: "nord",
        dirName: "nord",
        manifest: {
          id: "nord",
          name: "Nord Theme",
          version: "1.0.0",
          author: "Davinci",
          minAppVersion: "0.1.0",
          description: "A dark, arctic theme",
          styles: "theme.css",
        },
      },
    ],
    activeThemeId: null,
    themeDiscoveryErrors: [],
    onActivateTheme: () => {},
    themeManager: null,
    onReloadThemes: async () => {},
    onActivateThemeFromBrowser: async () => {},
  },
};

export default meta;
type Story = StoryObj<typeof SettingsDialog>;

export const Default: Story = {
  args: {},
};
