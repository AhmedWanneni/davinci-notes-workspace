import { useMemo } from "react";
import type { AgentConversation, AgentProject } from "@app/ai-agent";
import styles from "./AgentSidebarPanel.module.scss";

export interface AgentSidebarSearchResultsProps {
  query: string;
  conversations: AgentConversation[];
  projects: AgentProject[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

interface SearchMatch {
  conv: AgentConversation;
  projectName?: string;
  snippet?: string;
}

function extractSnippet(content: string, term: string): string {
  const idx = content.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return content.slice(0, 80);
  const start = Math.max(0, idx - 30);
  const end = Math.min(content.length, idx + term.length + 50);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < content.length ? "..." : "";
  return `${prefix}${content.slice(start, end).trim()}${suffix}`;
}

export function AgentSidebarSearchResults({
  query,
  conversations,
  projects,
  activeConversationId,
  onSelectConversation,
}: AgentSidebarSearchResultsProps) {
  const matches = useMemo<SearchMatch[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    const list: SearchMatch[] = [];

    for (const conv of conversations) {
      const titleMatch = conv.title.toLowerCase().includes(q);
      const projName = conv.projectId
        ? projectMap.get(conv.projectId)
        : undefined;
      const projMatch = projName ? projName.toLowerCase().includes(q) : false;

      let msgSnippet: string | undefined;
      for (const msg of conv.messages) {
        if (msg.content && msg.content.toLowerCase().includes(q)) {
          msgSnippet = extractSnippet(msg.content, q);
          break;
        }
      }

      if (titleMatch || projMatch || msgSnippet) {
        list.push({
          conv,
          projectName: projName,
          snippet: msgSnippet,
        });
      }
    }

    return list;
  }, [conversations, projects, query]);

  if (matches.length === 0) {
    return (
      <div className={styles["agent-sidebar__search-empty"]}>
        No chats found matching &ldquo;{query}&rdquo;
      </div>
    );
  }

  return (
    <div className={styles["agent-sidebar__search-results"]}>
      <div className={styles["agent-sidebar__search-header"]}>
        Search Results ({matches.length})
      </div>
      {matches.map(({ conv, projectName, snippet }) => {
        const isSelected = conv.id === activeConversationId;
        return (
          <button
            key={conv.id}
            type="button"
            className={`${styles["agent-sidebar__search-item"]} ${isSelected ? styles["is-active"] : ""}`}
            onClick={() => onSelectConversation(conv.id)}
          >
            <div className={styles["agent-sidebar__search-title-row"]}>
              <span className={styles["agent-sidebar__search-title"]}>
                {conv.title || "Untitled chat"}
              </span>
              {projectName && (
                <span className={styles["agent-sidebar__search-project-badge"]}>
                  {projectName}
                </span>
              )}
            </div>
            {snippet && (
              <span className={styles["agent-sidebar__search-snippet"]}>
                {snippet}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
