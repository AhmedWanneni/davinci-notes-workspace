import { Globe, ArrowSquareOut } from "@phosphor-icons/react";

export interface CitationItem {
  index: number;
  url: string;
  domain: string;
}

export interface AgentCitationsListProps {
  links: CitationItem[];
}

export function AgentCitationsList({ links }: AgentCitationsListProps) {
  if (!links || links.length === 0) return null;

  return (
    <div className="agent-citations-list" role="region" aria-label="Web sources">
      <div className="agent-citations-list__label">Sources</div>
      <div className="agent-citations-list__items">
        {links.map((link) => (
          <a
            key={link.index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="agent-citation-pill"
            title={link.url}
          >
            <Globe size={12} className="agent-citation-pill__icon" />
            <span className="agent-citation-pill__domain">{link.domain}</span>
            <span className="agent-citation-pill__index">[{link.index}]</span>
            <ArrowSquareOut size={10} className="agent-citation-pill__arrow" />
          </a>
        ))}
      </div>
    </div>
  );
}
