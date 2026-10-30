import type { Meta, StoryObj } from "@storybook/react";
import { RecentVaultsCard } from "./RecentVaultsCard";

const meta: Meta<typeof RecentVaultsCard> = {
  title: "Components/VaultWelcomeView/RecentVaultsCard",
  component: RecentVaultsCard,
  tags: ["autodocs"],
  args: {
    entries: [
      {
        name: "Personal Notes",
        path: "/Users/davinci/Documents/Personal",
        lastOpenedAt: Date.now() - 1000 * 60 * 15,
        exists: true,
      },
      {
        name: "Research Vault",
        path: "/Volumes/External/Research",
        lastOpenedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
        exists: false,
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof RecentVaultsCard>;

export const Default: Story = {};

export const SingleVault: Story = {
  args: {
    entries: [
      {
        name: "My Notes",
        path: "/Users/davinci/MyNotes",
        lastOpenedAt: Date.now() - 1000 * 60 * 2,
        exists: true,
      },
    ],
  },
};
