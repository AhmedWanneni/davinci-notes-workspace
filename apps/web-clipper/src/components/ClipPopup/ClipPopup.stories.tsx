import type { Meta, StoryObj } from "@storybook/react";
import { ARTICLE_TEMPLATE, type ClipPayload } from "@app/clipper-core";
import { ClipPopup, type ClipPopupController } from "./ClipPopup";

const PAYLOAD: ClipPayload = {
  version: 1,
  clipId: "clip-01H",
  capturedAt: "2026-10-17T09:05:07.000Z",
  mode: "full",
  templateId: ARTICLE_TEMPLATE.id,
  behavior: "create",
  target: { folder: "Clippings", noteName: "Why probes drift.md" },
  source: {
    url: "https://probe.example/why-probes-drift",
    title: "Why probes drift",
    site: "probe.example",
    author: "Ada Lovelace",
    published: "2026-04-02",
    wordCount: 1840,
  },
  properties: {
    author: "Ada Lovelace",
    published: "2026-04-02",
    source: "https://probe.example/why-probes-drift",
    site: "probe.example",
    created: "2026-10-17",
  },
  tags: ["clippings"],
  body: [
    "# Why probes drift",
    "",
    "A probe measures one thing well and then quietly starts measuring",
    "something else. The drift is rarely in the probe itself.",
  ].join("\n"),
  contentHash: "9f2c",
};

function controller(
  overrides: Partial<ClipPopupController> = {},
): ClipPopupController {
  return {
    status: "ready",
    mode: "full",
    templates: [ARTICLE_TEMPLATE],
    templateId: ARTICLE_TEMPLATE.id,
    matchedTemplateId: ARTICLE_TEMPLATE.id,
    disabledModes: ["highlights", "selection"],
    payload: PAYLOAD,
    draft: {
      noteName: PAYLOAD.target.noteName,
      folder: PAYLOAD.target.folder,
      properties: PAYLOAD.properties,
    },
    saving: false,
    setMode: (mode) => console.log("Clip mode:", mode),
    setTemplateId: (id) => console.log("Template:", id),
    setNoteName: (noteName) => console.log("Note name:", noteName),
    setFolder: (folder) => console.log("Folder:", folder),
    setProperty: (name, value) => console.log("Property:", name, value),
    download: () => console.log("Download the note file"),
    ...overrides,
  };
}

const meta: Meta<typeof ClipPopup> = {
  title: "Web Clipper/ClipPopup",
  component: ClipPopup,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ClipPopup>;

export const Ready: Story = {
  args: { controller: controller() },
};

export const WithSelection: Story = {
  args: {
    controller: controller({
      mode: "selection",
      disabledModes: ["highlights"],
      payload: { ...PAYLOAD, mode: "selection" },
    }),
  },
};

export const Loading: Story = {
  args: { controller: controller({ status: "loading", payload: undefined }) },
};

export const UnreadablePage: Story = {
  args: {
    controller: controller({
      status: "error",
      error: "This page could not be read.",
      payload: undefined,
    }),
  },
};

export const ExtractionWarning: Story = {
  args: {
    controller: controller({
      warning:
        "The article could not be extracted, so the note contains only the page metadata.",
    }),
  },
};

export const SaveFailed: Story = {
  args: {
    controller: controller({ error: "The note could not be saved." }),
  },
};

export const Saving: Story = {
  args: { controller: controller({ saving: true }) },
};
