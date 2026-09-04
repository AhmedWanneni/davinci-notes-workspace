import React, { Suspense, useState } from "react";
import {
  CaretDown,
  CaretRight,
  Link as LinkIcon,
  TreeStructure,
  ShareNetwork,
} from "@phosphor-icons/react";
import type { GraphIndex } from "@app/indexer";
import { Typography } from "@app/design-system";
import { BacklinksPanel } from "../BacklinksPanel";
import { NoteOutline } from "../NoteOutline";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { SuggestLinksPanel, type LinkSuggestion } from "../SuggestLinksPanel";

const LazyLocalGraphPanel = React.lazy(() =>
  import("../LocalGraphPanel").then((m) => ({ default: m.LocalGraphPanel })),
);

export interface RightSidebarProps {
  graph: GraphIndex | null;
  activePath: string | null;
  isCollapsed?: boolean;
  onSelectNote: (path: string) => void;
  suggestLinksEnabled?: boolean;
  suggestions?: LinkSuggestion[];
  onInsertSuggestedLink?: (path: string) => void;
}

export function RightSidebar({
  graph,
  activePath,
  isCollapsed,
  onSelectNote,
  suggestLinksEnabled = false,
  suggestions = [],
  onInsertSuggestedLink,
}: RightSidebarProps) {
  const [isMentionsOpen, setIsMentionsOpen] = useState(true);
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [isGraphOpen, setIsGraphOpen] = useState(false);

  const activeContent = useWorkspaceStore(
    (state) => (activePath ? state.notesContent[activePath] : "") || "",
  );

  const isCanvasActive = activePath?.endsWith(".canvas") ?? false;

  return (
    <aside
      className="app-right-sidebar"
      data-collapsed={isCollapsed || undefined}
      aria-label="Right Sidebar"
    >
      <div className="app-right-sidebar__content">
        {/* Section 1: Mentions (Linked + Unlinked) */}
        <div className="app-right-sidebar__section">
          <button
            type="button"
            className="app-right-sidebar__section-header"
            onClick={() => setIsMentionsOpen((prev) => !prev)}
            aria-expanded={isMentionsOpen}
          >
            <span className="app-right-sidebar__chevron" aria-hidden="true">
              {isMentionsOpen ? (
                <CaretDown size={14} />
              ) : (
                <CaretRight size={14} />
              )}
            </span>
            <LinkIcon size={14} className="app-right-sidebar__icon" />
            <Typography variant="text" size="xs" weight="semibold">
              Linked mentions
            </Typography>
          </button>

          {isMentionsOpen && (
            <div className="app-right-sidebar__section-body">
              {isCanvasActive ? (
                <div className="app-right-sidebar__subsection-empty">
                  <Typography variant="text" size="xs" color="muted">
                    Canvas files do not have linked mentions
                  </Typography>
                </div>
              ) : (
                <>
                  <BacklinksPanel
                    activePath={activePath}
                    onSelectNote={onSelectNote}
                  />
                  {suggestLinksEnabled && onInsertSuggestedLink && (
                    <SuggestLinksPanel suggestions={suggestions} onInsertLink={onInsertSuggestedLink} />
                  )}

                  <div className="app-right-sidebar__subsection">
                    <div className="app-right-sidebar__subsection-header">
                      <Typography
                        variant="text"
                        size="xs"
                        color="muted"
                        weight="medium"
                      >
                        Unlinked mentions
                      </Typography>
                      <span className="app-right-sidebar__count">0</span>
                    </div>
                    <div className="app-right-sidebar__subsection-empty">
                      <Typography variant="text" size="xs" color="muted">
                        No unlinked mentions found
                      </Typography>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Outline */}
        <div className="app-right-sidebar__section">
          <button
            type="button"
            className="app-right-sidebar__section-header"
            onClick={() => setIsOutlineOpen((prev) => !prev)}
            aria-expanded={isOutlineOpen}
          >
            <span className="app-right-sidebar__chevron" aria-hidden="true">
              {isOutlineOpen ? (
                <CaretDown size={14} />
              ) : (
                <CaretRight size={14} />
              )}
            </span>
            <TreeStructure size={14} className="app-right-sidebar__icon" />
            <Typography variant="text" size="xs" weight="semibold">
              Outline
            </Typography>
          </button>

          {isOutlineOpen && (
            <div className="app-right-sidebar__section-body">
              {isCanvasActive ? (
                <div className="app-right-sidebar__subsection-empty">
                  <Typography variant="text" size="xs" color="muted">
                    Canvas outline not available
                  </Typography>
                </div>
              ) : (
                <NoteOutline content={activeContent} />
              )}
            </div>
          )}
        </div>

        {/* Section 3: Local Graph */}
        <div className="app-right-sidebar__section">
          <button
            type="button"
            className="app-right-sidebar__section-header"
            onClick={() => setIsGraphOpen((prev) => !prev)}
            aria-expanded={isGraphOpen}
          >
            <span className="app-right-sidebar__chevron" aria-hidden="true">
              {isGraphOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
            </span>
            <ShareNetwork size={14} className="app-right-sidebar__icon" />
            <Typography variant="text" size="xs" weight="semibold">
              Local Graph
            </Typography>
          </button>

          {isGraphOpen && (
            <div className="app-right-sidebar__section-body">
              {isCanvasActive ? (
                <div className="app-right-sidebar__subsection-empty">
                  <Typography variant="text" size="xs" color="muted">
                    Local graph not available for canvas
                  </Typography>
                </div>
              ) : (
                <Suspense fallback={null}>
                  <LazyLocalGraphPanel
                    graph={graph}
                    activePath={activePath}
                    onSelectNote={onSelectNote}
                  />
                </Suspense>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
