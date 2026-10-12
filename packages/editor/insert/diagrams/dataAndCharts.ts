import type { InsertItem } from "../InsertItem";
import { field, wrapMermaid } from "./types";

export const dataAndChartsDiagrams: readonly InsertItem[] = [
  {
    id: "diagram-pie",
    group: "Diagrams",
    subgroup: "Data and charts",
    label: "Pie chart",
    icon: "Graph",
    keywords: ["pie", "chart", "slice", "percentage", "data", "diagram"],
    build: (context) =>
      wrapMermaid(
        `pie title ${field(1, "Storage Usage", context)}\n    "${field(2, "Documents")}" : ${field(3, "55")}\n    "${field(4, "Attachments")}" : ${field(5, "30")}\n    "${field(6, "Backups")}" : ${field(7, "15")}`,
      ),
  },
  {
    id: "diagram-quadrant",
    group: "Diagrams",
    subgroup: "Data and charts",
    label: "Quadrant chart",
    icon: "Graph",
    keywords: ["quadrant", "chart", "matrix", "2x2", "grid", "diagram"],
    build: (context) =>
      wrapMermaid(
        `quadrantChart\n    title ${field(1, "Priority Matrix", context)}\n    x-axis ${field(2, "Low Urgency")} --> ${field(3, "High Urgency")}\n    y-axis ${field(4, "Low Impact")} --> ${field(5, "High Impact")}\n    quadrant-1 ${field(6, "Urgent & High Impact")}\n    quadrant-2 ${field(7, "High Impact")}\n    quadrant-3 ${field(8, "Low Priority")}\n    quadrant-4 ${field(9, "Urgent")}\n    ${field(10, "Task A")}: [0.8, 0.7]`,
      ),
  },
  {
    id: "diagram-xy-chart",
    group: "Diagrams",
    subgroup: "Data and charts",
    label: "XY chart",
    icon: "Graph",
    keywords: ["xy", "xychart", "chart", "bar", "line", "plot", "diagram"],
    build: (context) =>
      wrapMermaid(
        `xychart-beta\n    title "${field(1, "Monthly Growth", context)}"\n    x-axis [${field(2, "Jan")}, ${field(3, "Feb")}, ${field(4, "Mar")}, ${field(5, "Apr")}]\n    y-axis "${field(6, "Users")}" 0 --> 100\n    bar [${field(7, "25")}, ${field(8, "45")}, ${field(9, "70")}, ${field(10, "95")}]`,
      ),
  },
  {
    id: "diagram-sankey",
    group: "Diagrams",
    subgroup: "Data and charts",
    label: "Sankey diagram",
    icon: "Graph",
    keywords: [
      "sankey",
      "flow",
      "alluvial",
      "distribution",
      "data",
      "diagram",
    ],
    build: (context) =>
      wrapMermaid(
        `sankey-beta\n    ${field(1, "Energy", context)},${field(2, "Electricity")},${field(3, "40")}\n    ${field(1, "Energy", context)},${field(4, "Heating")},${field(5, "30")}\n    ${field(1, "Energy", context)},${field(6, "Loss")},${field(7, "15")}`,
      ),
  },
  {
    id: "diagram-radar",
    group: "Diagrams",
    subgroup: "Data and charts",
    label: "Radar chart",
    icon: "Graph",
    keywords: ["radar", "spider", "web", "chart", "metrics", "diagram"],
    build: (context) =>
      wrapMermaid(
        `radar-beta\n    title ${field(1, "Skill Assessment", context)}\n    axis ${field(2, "Speed")}, ${field(3, "Quality")}, ${field(4, "Reliability")}, ${field(5, "Teamwork")}\n    curve ${field(6, "Team")} {\n        ${field(7, "80")}, ${field(8, "90")}, ${field(9, "85")}, ${field(10, "75")}\n    }`,
      ),
  },
  {
    id: "diagram-treemap",
    group: "Diagrams",
    subgroup: "Data and charts",
    label: "Treemap",
    icon: "Graph",
    keywords: [
      "treemap",
      "hierarchy",
      "nested",
      "chart",
      "data",
      "diagram",
    ],
    build: (context) =>
      wrapMermaid(
        `treemap\n    "${field(1, "Total", context)}": 100\n    "${field(2, "Documents")}": 60\n    "${field(3, "Media")}": 40`,
      ),
  },
];
