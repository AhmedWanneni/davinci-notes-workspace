import type { LibraryItem } from "@app/ai-agent";

export const DEFAULT_LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: "lib-default-1",
    projectId: "proj_general",
    type: "skill",
    title: "Meeting Summary & Action Items",
    description:
      "Extract decisions, action items with owners, and next milestones from meeting notes.",
    content:
      "Please review the notes and create: 1. Executive Summary, 2. Key Decisions, 3. Action Items formatted as a markdown table with [Task, Owner, Due Date], 4. Open Questions.",
    tags: ["Productivity", "Meetings"],
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: "lib-default-2",
    projectId: "proj_general",
    type: "rule",
    title: "Concise Bulleted Communication",
    description:
      "Enforce strict, information-dense bullet points with no pleasantries or fluff.",
    content:
      "Respond strictly with concise bullet points. Avoid preamble, pleasantries, or generic summaries. Highlight crucial numbers and file links in bold.",
    tags: ["Formatting", "Style"],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: "lib-default-3",
    projectId: "proj_general",
    type: "prompt",
    title: "Synthesize Project Wiki Note",
    description:
      "Generate an interconnected wiki note with [[Wikilinks]] synthesizing related documents.",
    content:
      "Review all notes related to this project and synthesize them into an interconnected concept wiki note. Use [[Wikilinks]] for all key terms, entities, and related documents.",
    tags: ["Wiki", "Knowledge"],
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: "lib-default-4",
    projectId: "proj_general",
    type: "skill",
    title: "Vault Reorganizer & Folder Triage",
    description:
      "Categorize loose inbox notes into appropriate topic folders (Finance, Work, Ideas).",
    content:
      "Scan the loose notes in my vault root/inbox and propose moving each into an appropriate topic folder based on its frontmatter tags and contents.",
    tags: ["Vault", "Organization"],
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10,
  },
  {
    id: "lib-default-5",
    projectId: "proj_general",
    type: "rule",
    title: "Obsidian Markdown & Wikilinks Only",
    description:
      "Ensure all internal cross-references use standard [[Note Name]] wikilink syntax.",
    content:
      "Always link existing notes and new concepts using Obsidian [[Wikilinks]] syntax rather than standard web URLs or plain text.",
    tags: ["Obsidian", "Links"],
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 86400000 * 14,
  },
  {
    id: "lib-default-6",
    projectId: "proj_general",
    type: "prompt",
    title: "Competitive Analysis Table",
    description:
      "Produce a comparative matrix evaluating features, pros, cons, and pricing.",
    content:
      "Build a structured comparison table analyzing competitors in this space. Include columns for Feature, Leading Competitor, Our Advantage, and Gaps.",
    tags: ["Research", "Business"],
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 20,
  },
];
