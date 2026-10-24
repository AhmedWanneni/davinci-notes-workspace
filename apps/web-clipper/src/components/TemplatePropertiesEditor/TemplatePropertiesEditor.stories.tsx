import type { Meta, StoryObj } from "@storybook/react";
import { ARTICLE_TEMPLATE } from "@app/clipper-core";
import { TemplatePropertiesEditor } from "./TemplatePropertiesEditor";

const meta: Meta<typeof TemplatePropertiesEditor> = {
  title: "Web Clipper/TemplatePropertiesEditor",
  component: TemplatePropertiesEditor,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TemplatePropertiesEditor>;

export const ArticleProperties: Story = {
  args: {
    properties: ARTICLE_TEMPLATE.properties,
    onChange: () => {},
    onAdd: () => {},
    onRemove: () => {},
  },
};

export const None: Story = {
  args: {
    properties: [],
    onChange: () => {},
    onAdd: () => {},
    onRemove: () => {},
  },
};
