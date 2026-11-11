import type { Meta, StoryObj } from "@storybook/react";
import { AIListeningPrivacyModal } from "./AIListeningPrivacyModal";

const meta: Meta<typeof AIListeningPrivacyModal> = {
  title: "ListeningView/AIListeningPrivacyModal",
  component: AIListeningPrivacyModal,
};

export default meta;
type Story = StoryObj<typeof AIListeningPrivacyModal>;

export const GeminiWarning: Story = {
  args: {
    isOpen: true,
    provider: "gemini",
  },
};

export const OllamaLocal: Story = {
  args: {
    isOpen: true,
    provider: "ollama",
  },
};

export const CloudProviderNotice: Story = {
  args: {
    isOpen: true,
    provider: "openai",
  },
};
