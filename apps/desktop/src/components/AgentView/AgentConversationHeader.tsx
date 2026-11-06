import { useState, useRef, useEffect } from "react";
import { DotsThree } from "@phosphor-icons/react";

export interface AgentConversationHeaderProps {
  title: string;
  projectName?: string;
  projectId?: string | null;
  onNavigateProject?: (projectId: string) => void;
  onRename?: () => void;
  onDelete?: () => void;
}

export function AgentConversationHeader({
  title,
  projectName,
  projectId,
  onNavigateProject,
  onRename,
  onDelete,
}: AgentConversationHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <header
      className="agent-chat-header"
      role="banner"
      aria-label="Conversation Header"
    >
      <div className="agent-chat-header__row">
        <div className="agent-chat-header__info">
          <div className="agent-chat-header__title-group">
            {projectName && (
              <>
                <button
                  type="button"
                  className="agent-chat-header__project-tag"
                  onClick={() => projectId && onNavigateProject?.(projectId)}
                  title={`Project: ${projectName} (Click to open project overview)`}
                >
                  {projectName}
                </button>
                <span className="agent-chat-header__separator">/</span>
              </>
            )}
            <h1 className="agent-chat-header__title">{title}</h1>
          </div>
        </div>

        <div className="agent-chat-header__actions">
          <div className="agent-chat-header__menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="agent-chat-header__icon-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="More options"
              title="More options"
            >
              <DotsThree size={18} weight="bold" />
            </button>

            {menuOpen && (
              <div className="agent-chat-header__dropdown-menu" role="menu">
                {onRename && (
                  <button
                    type="button"
                    className="agent-chat-header__dropdown-item"
                    onClick={() => {
                      setMenuOpen(false);
                      onRename();
                    }}
                  >
                    Rename
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className="agent-chat-header__dropdown-item is-danger"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
