import type { Meta, StoryObj } from "@storybook/react";
import { ARTICLE_TEMPLATE, STARTER_TEMPLATES } from "@app/clipper-core";
import { TemplatesPanel } from "./TemplatesPanel";

const controller = {
  loading: false,
  templates: STARTER_TEMPLATES,
  selectedId: "article",
  draft: ARTICLE_TEMPLATE,
  dirty: false,
  errors: [],
  saving: false,
  select: () => {},
  create: () => {},
  duplicate: () => {},
  remove: () => {},
  restoreStarters: () => {},
  importTemplates: () => {},
  patch: () => {},
  setProperty: () => {},
  addProperty: () => {},
  removeProperty: () => {},
  save: () => {},
  discard: () => {},
};

const meta: Meta<typeof TemplatesPanel> = {
  title: "Web Clipper/TemplatesPanel",
  component: TemplatesPanel,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof TemplatesPanel>;

export const Ready: Story = {
  args: { controller },
};

export const Loading: Story = {
  args: { controller: { ...controller, loading: true } },
};

export const NothingSelected: Story = {
  args: {
    controller: { ...controller, selectedId: undefined, draft: undefined },
  },
};

export const RefusedAndUnsaved: Story = {
  args: {
    controller: {
      ...controller,
      dirty: true,
      errors: ["triggers[0] is empty"],
    },
  },
};

export const WriteFailed: Story = {
  args: {
    controller: { ...controller, failure: "The templates could not be saved." },
  },
};
