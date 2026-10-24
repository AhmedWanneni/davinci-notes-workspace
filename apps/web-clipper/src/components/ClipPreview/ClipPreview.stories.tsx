import type { Meta, StoryObj } from "@storybook/react";
import { ClipPreview } from "./ClipPreview";

const BODY = [
  "# Why probes drift",
  "",
  "A probe measures one thing well and then quietly starts measuring something",
  "else. The drift is rarely in the probe itself.",
  "",
  "- Recalibrate on a schedule, not on suspicion",
  "- Record the raw reading before any correction",
].join("\n");

const meta: Meta<typeof ClipPreview> = {
  title: "Web Clipper/ClipPreview",
  component: ClipPreview,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ClipPreview>;

export const Default: Story = {
  args: {
    tags: ["clippings"],
    body: BODY,
  },
};

export const NoTags: Story = {
  args: {
    tags: [],
    body: BODY,
  },
};

export const ManyTags: Story = {
  args: {
    tags: ["clippings", "recipe", "soup", "weeknight"],
    body: "## Ingredients\n\n- 2 leeks\n- 1 litre stock",
  },
};

export const EmptyContent: Story = {
  args: {
    tags: ["clippings"],
    body: "",
  },
};

export const Truncated: Story = {
  args: {
    tags: ["clippings"],
    body: `${BODY}\n\n${"Filler paragraph that stands in for a clipboard-breaking page.\n\n".repeat(
      40,
    )}`,
    visibleBodyLength: 320,
  },
};

export const HostileContent: Story = {
  args: {
    tags: ["<img src=x onerror=alert(1)>"],
    body: "<script>window.pwned = 1</script>\n\nMarkup from the page is text here.",
  },
};
