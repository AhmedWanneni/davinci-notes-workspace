import type { Meta, StoryObj } from "@storybook/react";
import { WebBookmarkImportModal } from "./WebBookmarkImportModal";

const meta: Meta<typeof WebBookmarkImportModal> = {
  title: "Components/Bookmarks/WebBookmarkImportModal",
  component: WebBookmarkImportModal,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onImport: () => {},
    onClose: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof WebBookmarkImportModal>;

export const Default: Story = {};
