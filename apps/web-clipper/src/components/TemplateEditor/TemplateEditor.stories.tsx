import type { Meta, StoryObj } from "@storybook/react";
import { ARTICLE_TEMPLATE } from "@app/clipper-core";
import { TemplateEditor } from "./TemplateEditor";

const meta: Meta<typeof TemplateEditor> = {
  title: "Web Clipper/TemplateEditor",
  component: TemplateEditor,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TemplateEditor>;

export const Starter: Story = {
  args: {
    draft: ARTICLE_TEMPLATE,
    errors: [],
    dirty: false,
    saving: false,
    onChange: () => {},
    onPropertyChange: () => {},
    onAddProperty: () => {},
    onRemoveProperty: () => {},
    onSave: () => {},
    onDiscard: () => {},
  },
};

export const Edited: Story = {
  args: {
    ...Starter.args,
    dirty: true,
  },
};

export const Refused: Story = {
  args: {
    ...Starter.args,
    dirty: true,
    errors: [
      "triggers[1] repeats a group that itself repeats or alternates, which can hang the browser; split it into two rules",
    ],
  },
};

export const Saving: Story = {
  args: {
    ...Starter.args,
    dirty: true,
    saving: true,
  },
};
