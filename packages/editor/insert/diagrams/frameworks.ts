import type { InsertItem } from "../InsertItem";
import { field, wrapMermaid } from "./types";

export const frameworksDiagrams: readonly InsertItem[] = [
  {
    id: "diagram-mindmap",
    group: "Diagrams",
    subgroup: "Frameworks",
    label: "Mindmap",
    icon: "Graph",
    keywords: [
      "mindmap",
      "brainstorm",
      "tree",
      "idea",
      "framework",
      "diagram",
    ],
    build: (context) =>
      wrapMermaid(
        `mindmap\n  root((${field(1, "Central Idea", context)}))\n    ${field(2, "Concept A")}\n      ${field(3, "Detail 1")}\n      ${field(4, "Detail 2")}\n    ${field(5, "Concept B")}\n      ${field(6, "Detail 3")}`,
      ),
  },
  {
    id: "diagram-cynefin",
    group: "Diagrams",
    subgroup: "Frameworks",
    label: "Cynefin framework",
    icon: "Graph",
    keywords: [
      "cynefin",
      "framework",
      "sensemaking",
      "decision",
      "complexity",
      "diagram",
    ],
    build: (context) =>
      wrapMermaid(
        `cynefin-beta\n    title ${field(1, "Sensemaking Framework", context)}\n    complex\n        "${field(2, "Probe and sense")}"\n    complicated\n        "${field(3, "Expert analysis")}"\n    clear\n        "${field(4, "Standard practice")}"\n    chaotic\n        "${field(5, "Rapid response")}"\n    confusion\n        "${field(6, "Awaiting clarity")}"\n    complex --> complicated: "${field(7, "Pattern identified")}"`,
      ),
  },
];
