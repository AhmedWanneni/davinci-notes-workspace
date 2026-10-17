import type { Meta, StoryObj } from "@storybook/react";
import { ARTICLE_TEMPLATE, RECIPE_TEMPLATE } from "@app/clipper-core";
import { TemplatePicker } from "./TemplatePicker";

const meta: Meta<typeof TemplatePicker> = {
  title: "Web Clipper/TemplatePicker",
  component: TemplatePicker,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TemplatePicker>;

export const Matched: Story = {
  args: {
    templates: [ARTICLE_TEMPLATE, RECIPE_TEMPLATE],
    selectedId: ARTICLE_TEMPLATE.id,
    matchedId: ARTICLE_TEMPLATE.id,
    onSelect: (id) => console.log("Template:", id),
  },
};

export const ChosenByHand: Story = {
  args: {
    templates: [ARTICLE_TEMPLATE, RECIPE_TEMPLATE],
    selectedId: RECIPE_TEMPLATE.id,
    matchedId: ARTICLE_TEMPLATE.id,
    onSelect: () => {},
  },
};

export const NoRuleMatched: Story = {
  args: {
    templates: [ARTICLE_TEMPLATE, RECIPE_TEMPLATE],
    selectedId: ARTICLE_TEMPLATE.id,
    onSelect: () => {},
  },
};

export const SingleTemplate: Story = {
  args: {
    templates: [ARTICLE_TEMPLATE],
    selectedId: ARTICLE_TEMPLATE.id,
    matchedId: ARTICLE_TEMPLATE.id,
    onSelect: () => {},
  },
};
