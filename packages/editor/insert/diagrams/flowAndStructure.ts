import type { InsertItem } from "../InsertItem";
import { field, wrapMermaid } from "./types";

export const flowAndStructureDiagrams: readonly InsertItem[] = [
  {
    id: "diagram-flowchart",
    group: "Diagrams",
    subgroup: "Flow and structure",
    label: "Flowchart",
    icon: "Graph",
    keywords: ["flowchart", "flow", "graph", "diagram", "process"],
    build: (context) =>
      wrapMermaid(
        `graph TD\n    ${field(1, "A", context)}[${field(2, "Start", context)}] --> ${field(3, "B")}{${field(4, "Decision")}}\n    ${field(3, "B")} -->|${field(5, "Yes")}| ${field(6, "C")}[${field(7, "Action")}]\n    ${field(3, "B")} -->|${field(8, "No")}| ${field(9, "D")}[${field(10, "End")}]`,
      ),
  },
  {
    id: "diagram-sequence",
    group: "Diagrams",
    subgroup: "Flow and structure",
    label: "Sequence diagram",
    icon: "Graph",
    keywords: ["sequence", "uml", "interaction", "message", "diagram"],
    build: (context) =>
      wrapMermaid(
        `sequenceDiagram\n    autonumber\n    ${field(1, "User", context)}->>${field(2, "Client")}: ${field(3, "Request")}\n    ${field(2, "Client")}->>${field(4, "Server")}: ${field(5, "Process")}\n    ${field(4, "Server")}-->>${field(2, "Client")}: ${field(6, "Response")}\n    ${field(2, "Client")}-->>${field(1, "User", context)}: ${field(7, "Result")}`,
      ),
  },
  {
    id: "diagram-class",
    group: "Diagrams",
    subgroup: "Flow and structure",
    label: "Class diagram",
    icon: "Graph",
    keywords: ["class", "uml", "oop", "object", "diagram"],
    build: (context) =>
      wrapMermaid(
        `classDiagram\n    class ${field(1, "Item", context)} {\n        +String ${field(2, "id")}\n        +${field(3, "save")}()\n    }\n    ${field(1, "Item", context)} <|-- ${field(4, "Note")}\n    class ${field(4, "Note")} {\n        +String ${field(5, "title")}\n    }`,
      ),
  },
  {
    id: "diagram-state",
    group: "Diagrams",
    subgroup: "Flow and structure",
    label: "State diagram",
    icon: "Graph",
    keywords: ["state", "statemachine", "fsm", "uml", "diagram"],
    build: (context) =>
      wrapMermaid(
        `stateDiagram-v2\n    [*] --> ${field(1, "Draft", context)}\n    ${field(1, "Draft", context)} --> ${field(2, "Review")}: ${field(3, "Submit")}\n    ${field(2, "Review")} --> ${field(4, "Published")}: ${field(5, "Approve")}\n    ${field(2, "Review")} --> ${field(1, "Draft", context)}: ${field(6, "Reject")}\n    ${field(4, "Published")} --> [*]`,
      ),
  },
  {
    id: "diagram-er",
    group: "Diagrams",
    subgroup: "Flow and structure",
    label: "Entity-relationship diagram",
    icon: "Graph",
    keywords: [
      "entity",
      "relationship",
      "er",
      "erd",
      "database",
      "schema",
      "diagram",
    ],
    build: (context) =>
      wrapMermaid(
        `erDiagram\n    ${field(1, "USER", context)} ||--o{ ${field(2, "NOTE")} : ${field(3, "owns")}\n    ${field(1, "USER", context)} {\n        string ${field(4, "id")}\n        string ${field(5, "name")}\n    }\n    ${field(2, "NOTE")} {\n        string ${field(6, "id")}\n        string ${field(7, "title")}\n    }`,
      ),
  },
  {
    id: "diagram-block",
    group: "Diagrams",
    subgroup: "Flow and structure",
    label: "Block diagram",
    icon: "Graph",
    keywords: [
      "block",
      "blockdiagram",
      "boxes",
      "layout",
      "structure",
      "diagram",
    ],
    build: (context) =>
      wrapMermaid(
        `block-beta\n    columns 3\n    ${field(1, "Input", context)}["${field(2, "Input", context)}"]\n    arrow1<["${field(3, "process")}"]>(right)\n    ${field(4, "Output")}["${field(5, "Output")}"]`,
      ),
  },
  {
    id: "diagram-packet",
    group: "Diagrams",
    subgroup: "Flow and structure",
    label: "Packet diagram",
    icon: "Graph",
    keywords: ["packet", "network", "protocol", "bits", "bytes", "diagram"],
    build: (context) =>
      wrapMermaid(
        `packet-beta\n    0-15: "${field(1, "Source Port", context)}"\n    16-31: "${field(2, "Destination Port")}"\n    32-63: "${field(3, "Sequence Number")}"`,
      ),
  },
  {
    id: "diagram-architecture",
    group: "Diagrams",
    subgroup: "Flow and structure",
    label: "Architecture diagram",
    icon: "Graph",
    keywords: ["architecture", "arch", "cloud", "service", "system", "diagram"],
    build: (context) =>
      wrapMermaid(
        `architecture-beta\n    group ${field(1, "cloud", context)}(cloud)[${field(2, "Cloud Network")}]\n    service ${field(3, "api")}(server)[${field(4, "API Gateway")}] in ${field(1, "cloud", context)}\n    service ${field(5, "db")}(database)[${field(6, "Primary DB")}] in ${field(1, "cloud", context)}\n    ${field(3, "api")}:R -- L:${field(5, "db")}`,
      ),
  },
];
