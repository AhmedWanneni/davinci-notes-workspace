import type { Meta, StoryObj } from "@storybook/react-vite";
import { GoogleAccountCard } from "./GoogleAccountCard";

const meta = {
  title: "Components/SettingsDialog/GoogleAccountCard",
  component: GoogleAccountCard,
} satisfies Meta<typeof GoogleAccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Disconnected: Story = {
  args: {
    isConnected: false,
    isConnecting: false,
    isLoading: false,
    clientId: "",
    errorMessage: null,
    onClientIdChange: () => {},
    onConnect: () => {},
    onDisconnect: () => {},
  },
};

export const Connecting: Story = {
  args: {
    ...Disconnected.args,
    isConnecting: true,
  },
};

export const Connected: Story = {
  args: {
    ...Disconnected.args,
    isConnected: true,
  },
};

export const WithError: Story = {
  args: {
    ...Disconnected.args,
    errorMessage: "Google Client ID is not configured.",
  },
};
