import type { Meta, StoryObj } from "@storybook/react";
import { ARTICLE_TEMPLATE } from "@app/clipper-core";
import { TemplateTransferControls } from "./TemplateTransferControls";

const meta: Meta<typeof TemplateTransferControls> = {
  title: "Web Clipper/TemplateTransferControls",
  component: TemplateTransferControls,
};

export default meta;
type Story = StoryObj<typeof TemplateTransferControls>;

export const Ready: Story = {
  args: { templates: [ARTICLE_TEMPLATE], disabled: false, onImport: () => {} },
};

export const Disabled: Story = { args: { ...Ready.args, disabled: true } };
