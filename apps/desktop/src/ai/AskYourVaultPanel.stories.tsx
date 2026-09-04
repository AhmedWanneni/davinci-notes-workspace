import type { Meta, StoryObj } from "@storybook/react";
import { AskYourVaultPanel } from "./AskYourVaultPanel";

const meta = { title: "AI/AskYourVaultPanel", component: AskYourVaultPanel } satisfies Meta<typeof AskYourVaultPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const CloudAnswer: Story = { args: { cloudActive: true, onAsk: async () => ({ answer: "Forty-two.", retrieved: [], citations: [{ chunkId: "a", notePath: "math.md", heading: "Facts", startLine: 2, endLine: 3 }] }), onOpenCitation: () => {} } };
export const FailedKey: Story = { args: { cloudActive: true, onAsk: async () => { throw new globalThis.Error("API key rejected"); }, onOpenCitation: () => {} } };
