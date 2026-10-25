import { Brain, FileText, Folders, Globe, CalendarCheck } from "@phosphor-icons/react";
import { Typography } from "@app/design-system";

export interface AgentStarterPromptsProps {
  vaultName: string;
  onSelectPrompt: (prompt: string) => void;
}

const CAPABILITY_CARDS = [
  {
    icon: FileText,
    category: "Create & Draft",
    title: "Weekly Summary & Tasks",
    desc: "Extract key decisions and uncompleted checklists into a fresh note",
    prompt: "Scan notes in my vault from this week and create a prioritized action list.",
  },
  {
    icon: Folders,
    category: "Organize & Route",
    title: "Sort Inbox into Topics",
    desc: "Review loose notes and group them into Finance, Projects, or Work folders",
    prompt: "Review unorganized notes in my vault and propose moving them into appropriate topic folders.",
  },
  {
    icon: Brain,
    category: "Knowledge Wiki",
    title: "Synthesize Wiki Page",
    desc: "Create evergreen markdown pages with bidirectional [[Wikilinks]]",
    prompt: "Synthesize notes on my active project into an evergreen wiki page with [[Wikilinks]].",
  },
  {
    icon: Globe,
    category: "Web & Research",
    title: "Research with Web Search",
    desc: "Search external sources and synthesize answers directly with your notes",
    prompt: "Search the web for best practices related to my latest project and compare with my notes.",
  },
  {
    icon: CalendarCheck,
    category: "Automation & Calendar",
    title: "Sunday Weekly Review",
    desc: "Schedule recurring tasks or export action items to Google Calendar",
    prompt: "Schedule a recurring weekly task to prepare my to-do list every Sunday at 9:00 AM.",
  },
];

export function AgentStarterPrompts({
  vaultName,
  onSelectPrompt,
}: AgentStarterPromptsProps) {
  return (
    <div className="agent-view__empty">
      <div className="agent-view__empty-icon-wrap" aria-hidden="true">
        <Brain size={44} weight="regular" className="agent-view__empty-icon" />
      </div>

      <h1 className="agent-view__hero-title">
        What should we build in{" "}
        <span className="agent-view__vault-name" title={`Vault: ${vaultName}`}>
          {vaultName}
        </span>
        ?
      </h1>

      <Typography variant="text" size="xs" color="muted">
        What would you like to explore or create?
      </Typography>

      <div className="agent-view__capabilities-grid">
        {CAPABILITY_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              type="button"
              className="agent-view__capability-card"
              onClick={() => onSelectPrompt(card.prompt)}
            >
              <div className="agent-view__capability-badge">
                <Icon size={16} />
                <span>{card.category}</span>
              </div>
              <div className="agent-view__capability-title">{card.title}</div>
              <div className="agent-view__capability-desc">{card.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
