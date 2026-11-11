export interface SlashCommandItem {
  id: string;
  name: string;
  description: string;
  syntax: string;
  iconName: "plan" | "interview" | "usage" | "models" | "web" | "clear" | "help";
}

export const BUILTIN_SLASH_COMMANDS: SlashCommandItem[] = [
  {
    id: "plan",
    name: "/plan",
    syntax: "/plan <task>",
    description: "Carefully plan task with step-by-step breakdown & verification",
    iconName: "plan",
  },
  {
    id: "grill-me",
    name: "/grill-me",
    syntax: "/grill-me <topic>",
    description: "Interactive interview: clarifies decisions one-by-one with choices",
    iconName: "interview",
  },
  {
    id: "usage",
    name: "/usage",
    syntax: "/usage",
    description: "View active provider health, model info, and context stats",
    iconName: "usage",
  },
  {
    id: "models",
    name: "/models",
    syntax: "/models",
    description: "Open AI model and CLI agent picker",
    iconName: "models",
  },
  {
    id: "web",
    name: "/web",
    syntax: "/web <query>",
    description: "Search the web and cite verified public sources",
    iconName: "web",
  },
  {
    id: "clear",
    name: "/clear",
    syntax: "/clear",
    description: "Clear current conversation history",
    iconName: "clear",
  },
  {
    id: "help",
    name: "/help",
    syntax: "/help",
    description: "Show list of available slash commands and prompt options",
    iconName: "help",
  },
];
