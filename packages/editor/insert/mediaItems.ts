import type { InsertItem } from "./InsertItem";
import {
  validateImageUrl,
  validateYoutubeUrl,
  validateTweetUrl,
} from "./mediaValidation";

export const mediaItems: readonly InsertItem[] = [
  {
    id: "image",
    group: "Media",
    label: "Image",
    icon: "Image",
    keywords: ["image", "picture", "photo", "img", "media"],
    dialog: {
      kind: "image-sources",
      title: "Insert Image",
      description: "Choose a local file to import or provide an image URL.",
      placeholder: "https://example.com/image.png",
      confirmLabel: "Insert Image",
      validate: (input) => {
        if (input.path) return null;
        if (!input.url) return "Please choose a file or enter an image URL.";
        return validateImageUrl(input.url);
      },
    },
    build: (context) => {
      if (context.input?.path) {
        return { text: `![[${context.input.path}]]`, block: true };
      }
      const url = context.input?.url || "https://";
      return { text: `![](${url})`, block: true };
    },
  },
  {
    id: "youtube",
    group: "Media",
    label: "YouTube",
    icon: "VideoCamera",
    keywords: ["youtube", "video", "yt", "media"],
    dialog: {
      kind: "media-url",
      title: "Insert YouTube Video",
      description: "Enter a YouTube watch or youtu.be URL.",
      placeholder: "https://www.youtube.com/watch?v=...",
      confirmLabel: "Insert Video",
      validate: (input) => {
        if (!input.url) return "URL cannot be empty.";
        return validateYoutubeUrl(input.url);
      },
    },
    build: (context) => {
      const url = context.input?.url || "https://youtube.com/watch?v=";
      return { text: `![](${url})`, block: true };
    },
  },
  {
    id: "tweet",
    group: "Media",
    label: "Tweet / X",
    icon: "TwitterLogo",
    keywords: ["tweet", "twitter", "x", "post", "social", "media"],
    dialog: {
      kind: "media-url",
      title: "Insert Tweet / X Post",
      description: "Enter an X or Twitter post URL.",
      placeholder: "https://x.com/username/status/...",
      confirmLabel: "Insert Post",
      validate: (input) => {
        if (!input.url) return "URL cannot be empty.";
        return validateTweetUrl(input.url);
      },
    },
    build: (context) => {
      const url = context.input?.url || "https://x.com/";
      return { text: `![](${url})`, block: true };
    },
  },
];
