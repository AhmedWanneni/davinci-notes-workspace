import type { Meta, StoryObj } from "@storybook/react";
import { ClipEditor } from "./ClipEditor";

const meta: Meta<typeof ClipEditor> = {
  title: "Web Clipper/ClipEditor",
  component: ClipEditor,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ClipEditor>;

export const Default: Story = {
  args: {
    noteName: "Why probes drift.md",
    folder: "Clippings",
    properties: {
      author: "Ada Lovelace",
      published: "2026-04-02",
      source: "https://probe.example/why-probes-drift",
      site: "probe.example",
      created: "2026-10-17",
    },
    onNoteNameChange: (value) => console.log("Note name:", value),
    onFolderChange: (value) => console.log("Folder:", value),
    onPropertyChange: (name, value) => console.log("Property:", name, value),
  },
};

export const VaultRoot: Story = {
  args: {
    noteName: "Quick note.md",
    folder: "",
    properties: { source: "https://probe.example/quick" },
    onNoteNameChange: () => {},
    onFolderChange: () => {},
    onPropertyChange: () => {},
  },
};

export const ListValuedProperties: Story = {
  args: {
    noteName: "Probe Soup.md",
    folder: "Clippings/Recipes",
    properties: {
      cuisine: "Danish",
      servings: "4",
      recipeIngredient: ["2 leeks", "1 litre stock", "Salt"],
    },
    onNoteNameChange: () => {},
    onFolderChange: () => {},
    onPropertyChange: () => {},
  },
};

export const NoProperties: Story = {
  args: {
    noteName: "Bare clip.md",
    folder: "Clippings",
    properties: {},
    onNoteNameChange: () => {},
    onFolderChange: () => {},
    onPropertyChange: () => {},
  },
};

export const HostileMetadata: Story = {
  args: {
    noteName: "<script>window.pwned = 1</script>.md",
    folder: "Clippings",
    properties: {
      title: "<img src=x onerror=alert(1)>",
      source: "https://probe.example/hostile",
    },
    onNoteNameChange: () => {},
    onFolderChange: () => {},
    onPropertyChange: () => {},
  },
};
