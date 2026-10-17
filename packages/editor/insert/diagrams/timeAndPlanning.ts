import type { InsertItem } from "../InsertItem";
import { field, wrapMermaid } from "./types";

export const timeAndPlanningDiagrams: readonly InsertItem[] = [
  {
    id: "diagram-user-journey",
    group: "Diagrams",
    subgroup: "Time and planning",
    label: "User journey",
    icon: "Graph",
    keywords: ["journey", "user journey", "experience", "ux", "diagram"],
    build: (context) =>
      wrapMermaid(
        `journey\n    title ${field(1, "Onboarding Experience", context)}\n    section ${field(2, "Signup")}\n      ${field(3, "Visit landing")}: 5: ${field(4, "User")}\n      ${field(5, "Fill form")}: 3: ${field(4, "User")}\n    section ${field(6, "First Note")}\n      ${field(7, "Create note")}: 5: ${field(4, "User")}`,
      ),
  },
  {
    id: "diagram-gantt",
    group: "Diagrams",
    subgroup: "Time and planning",
    label: "Gantt chart",
    icon: "Graph",
    keywords: [
      "gantt",
      "chart",
      "schedule",
      "project",
      "planning",
      "diagram",
    ],
    build: (context) =>
      wrapMermaid(
        `gantt\n    title ${field(1, "Project Schedule", context)}\n    dateFormat YYYY-MM-DD\n    section ${field(2, "Milestones")}\n      ${field(3, "Research")} :done, 2026-10-01, ${field(4, "7d")}\n      ${field(5, "Implementation")} :active, 2026-10-08, ${field(6, "14d")}`,
      ),
  },
  {
    id: "diagram-timeline",
    group: "Diagrams",
    subgroup: "Time and planning",
    label: "Timeline",
    icon: "Graph",
    keywords: ["timeline", "chronology", "history", "milestones", "diagram"],
    build: (context) =>
      wrapMermaid(
        `timeline\n    title ${field(1, "Product Roadmap", context)}\n    ${field(2, "Q1 2026")} : ${field(3, "Research")} : ${field(4, "Architecture")}\n    ${field(5, "Q2 2026")} : ${field(6, "Alpha release")}\n    ${field(7, "Q3 2026")} : ${field(8, "Public launch")}`,
      ),
  },
  {
    id: "diagram-kanban",
    group: "Diagrams",
    subgroup: "Time and planning",
    label: "Kanban board",
    icon: "Graph",
    keywords: ["kanban", "board", "task", "todo", "agile", "diagram"],
    build: (context) =>
      wrapMermaid(
        `kanban\n    ${field(1, "Backlog", context)}\n      [${field(2, "Initial design")}]\n    ${field(3, "In Progress")}\n      [${field(4, "Core implementation")}]\n    ${field(5, "Done")}\n      [${field(6, "Project setup")}]`,
      ),
  },
  {
    id: "diagram-git-graph",
    group: "Diagrams",
    subgroup: "Time and planning",
    label: "Git graph",
    icon: "Graph",
    keywords: [
      "git",
      "gitgraph",
      "branch",
      "commit",
      "merge",
      "version",
      "diagram",
    ],
    build: (context) =>
      wrapMermaid(
        `gitGraph\n    commit id: "${field(1, "init", context)}"\n    branch ${field(2, "feature")}\n    checkout ${field(2, "feature")}\n    commit id: "${field(3, "feat")}"\n    checkout main\n    merge ${field(2, "feature")}`,
      ),
  },
];
