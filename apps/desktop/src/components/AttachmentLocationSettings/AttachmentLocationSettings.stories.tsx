import type { Meta, StoryObj } from "@storybook/react";
import { AttachmentLocationSettings } from "./AttachmentLocationSettings";
import { DEFAULT_ATTACHMENT_SETTINGS } from "@app/attachments";

const meta = {
  title: "Desktop/AttachmentLocationSettings",
  component: AttachmentLocationSettings,
} satisfies Meta<typeof AttachmentLocationSettings>;
export default meta;
type Story = StoryObj<typeof meta>;

export const VaultFolder: Story = {
  args: { settings: DEFAULT_ATTACHMENT_SETTINGS, onChange: () => {} },
};
export const SpecifiedFolder: Story = {
  args: { settings: { ...DEFAULT_ATTACHMENT_SETTINGS, locationMode: "specified-folder", specifiedFolder: "/Vault/Media" }, onChange: () => {} },
};
export const SameFolder: Story = {
  args: { settings: { ...DEFAULT_ATTACHMENT_SETTINGS, locationMode: "note-folder" }, onChange: () => {} },
};
export const Subfolder: Story = {
  args: { settings: { ...DEFAULT_ATTACHMENT_SETTINGS, locationMode: "note-subfolder" }, onChange: () => {} },
};
