import { Link as LinkIcon } from "@phosphor-icons/react";
import { Typography } from "@app/design-system";

export interface LinkSuggestion {
  path: string;
  heading: string | null;
  score: number;
}

export interface SuggestLinksPanelProps {
  suggestions: LinkSuggestion[];
  onInsertLink: (path: string) => void;
}

export function SuggestLinksPanel({ suggestions, onInsertLink }: SuggestLinksPanelProps) {
  if (suggestions.length === 0) return null;
  return (
    <div className="app-right-sidebar__subsection suggest-links-panel">
      <div className="app-right-sidebar__subsection-header">
        <LinkIcon size={14} aria-hidden="true" />
        <Typography variant="text" size="xs" color="muted" weight="medium">Related notes</Typography>
      </div>
      {suggestions.map((suggestion) => (
        <button type="button" className="suggest-links-panel__item" key={suggestion.path} onClick={() => onInsertLink(suggestion.path)}>
          <span>{suggestion.path}</span>
          <span>{suggestion.heading ?? "Related content"}</span>
        </button>
      ))}
    </div>
  );
}
