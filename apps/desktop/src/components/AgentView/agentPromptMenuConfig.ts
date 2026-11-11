export interface MenuPromptItem {
  label: string;
  prompt: string;
}

export const CONNECTOR_OPTIONS: MenuPromptItem[] = [
  {
    label: "Google Calendar",
    prompt: "Connect to my Google Calendar and list upcoming meetings.",
  },
  {
    label: "Syncthing P2P",
    prompt: "Check syncthing status and vault replication health.",
  },
];

export const DESIGN_OPTIONS: MenuPromptItem[] = [
  {
    label: "Tokens & Typography",
    prompt: "Show our design tokens for colors, spacing, and typography.",
  },
  {
    label: "Mermaid Theme Guide",
    prompt: "Render a mermaid diagram following our Swiss editorial aesthetic.",
  },
];
