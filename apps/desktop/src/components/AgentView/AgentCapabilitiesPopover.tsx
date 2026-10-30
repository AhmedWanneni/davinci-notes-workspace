import { useRef, useEffect } from "react";
import {
  FileText,
  Folders,
  Brain,
  Globe,
  CalendarCheck,
  X,
} from "@phosphor-icons/react";
import { Typography } from "@app/design-system";

export interface AgentCapabilityOption {
  icon: typeof FileText;
  title: string;
  desc: string;
  prompt: string;
}

export const AGENT_CAPABILITIES: AgentCapabilityOption[] = [
  {
    icon: FileText,
    title: "Create Summary or To-Do",
    desc: "Generate meeting summaries, task checklists, or database tables",
    prompt: "Scan my recent notes and create a prioritized to-do list for this week.",
  },
  {
    icon: Folders,
    title: "Organize Vault Notes",
    desc: "Categorize notes into topic folders (Finance, Work, Ideas)",
    prompt: "Review unorganized notes in my inbox and organize them into topic folders.",
  },
  {
    icon: Brain,
    title: "Synthesize Wiki Topic",
    desc: "Create evergreen interlinked markdown pages with [[Wikilinks]]",
    prompt: "Synthesize notes related to current projects into an interconnected wiki note with [[Wikilinks]].",
  },
  {
    icon: Globe,
    title: "Research with Web Search",
    desc: "Search the web and compare findings with your vault knowledge",
    prompt: "Search the web for the latest updates on my current project topic and cross-reference with my notes.",
  },
  {
    icon: CalendarCheck,
    title: "Schedule or Sync Calendar",
    desc: "Setup recurring automated tasks or add reminders to Google Calendar",
    prompt: "Schedule a weekly review task to prepare my to-do list every Sunday.",
  },
];

export interface AgentCapabilitiesPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCapability: (prompt: string) => void;
}

export function AgentCapabilitiesPopover({
  isOpen,
  onClose,
  onSelectCapability,
}: AgentCapabilitiesPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="agent-capabilities-popover" ref={popoverRef} role="dialog" aria-label="Agent Capabilities">
      <div className="agent-capabilities-popover__header">
        <Typography variant="text" size="xs" weight="semibold">
          What the Agent Can Do
        </Typography>
        <button
          type="button"
          className="agent-capabilities-popover__close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={12} />
        </button>
      </div>

      <div className="agent-capabilities-popover__list">
        {AGENT_CAPABILITIES.map((cap, idx) => {
          const IconComponent = cap.icon;
          return (
            <button
              key={idx}
              type="button"
              className="agent-capabilities-popover__item"
              onClick={() => {
                onSelectCapability(cap.prompt);
                onClose();
              }}
            >
              <div className="agent-capabilities-popover__item-icon">
                <IconComponent size={16} />
              </div>
              <div className="agent-capabilities-popover__item-content">
                <div className="agent-capabilities-popover__item-title">{cap.title}</div>
                <div className="agent-capabilities-popover__item-desc">{cap.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
