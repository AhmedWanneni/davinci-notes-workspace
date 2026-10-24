import type { Meta, StoryObj } from "@storybook/react";
import { HighlighterPanel } from "./HighlighterPanel";

const meta: Meta<typeof HighlighterPanel> = {
  title: "Web Clipper/HighlighterPanel",
  component: HighlighterPanel,
};
export default meta;
type Story = StoryObj<typeof HighlighterPanel>;
const controller = {
  loading: false,
  enabled: false,
  changing: false,
  setEnabled: () => {},
};
export const Disabled: Story = { args: { controller } };
export const Enabled: Story = {
  args: { controller: { ...controller, enabled: true } },
};
