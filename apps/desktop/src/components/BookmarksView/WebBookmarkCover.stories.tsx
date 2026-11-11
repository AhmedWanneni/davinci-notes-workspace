import type { Meta, StoryObj } from "@storybook/react";
import { WebBookmarkCover } from "./WebBookmarkCover";

const meta: Meta<typeof WebBookmarkCover> = {
  title: "Components/Bookmarks/WebBookmarkCover",
  component: WebBookmarkCover,
  parameters: {
    layout: "centered",
  },
  args: {
    url: "https://github.com",
    title: "GitHub",
  },
};

export default meta;
type Story = StoryObj<typeof WebBookmarkCover>;

export const Default: Story = {
  args: {
    url: "https://github.com",
    title: "GitHub",
  },
};

export const CustomCover: Story = {
  args: {
    url: "https://github.com",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600",
    title: "Abstract Art",
  },
};

export const FaviconFallback: Story = {
  args: {
    url: "https://github.com",
    favicon: "https://github.com/favicon.ico",
    title: "GitHub Favicon",
  },
};
