import { Trash } from "@phosphor-icons/react";
import type { AgentConversation } from "@app/ai-agent";
import styles from "./AgentSidebarPanel.module.scss";

export interface AgentSidebarRecentsSectionProps {
  recentChats: AgentConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function AgentSidebarRecentsSection({
  recentChats,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
}: AgentSidebarRecentsSectionProps) {
  return (
    <div className={styles["agent-sidebar__section"]}>
      <div className={styles["agent-sidebar__section-header"]}>
        <span className={styles["agent-sidebar__section-title"]}>Recents</span>
      </div>
      <div className={styles["agent-sidebar__list"]}>
        {recentChats.map((c) => {
          const isSelected = c.id === activeConversationId;
          return (
            <div
              key={c.id}
              className={`${styles["agent-sidebar__recent-item"]} ${isSelected ? styles["is-active"] : ""}`}
            >
              <button
                type="button"
                className={styles["agent-sidebar__recent-btn"]}
                onClick={() => onSelectConversation(c.id)}
              >
                <span className={styles["agent-sidebar__chat-title"]}>
                  {c.title}
                </span>
              </button>
              <button
                type="button"
                className={styles["agent-sidebar__delete-btn"]}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(c.id);
                }}
                aria-label={`Delete ${c.title}`}
              >
                <Trash size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
