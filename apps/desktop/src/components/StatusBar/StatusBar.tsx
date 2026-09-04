import React, { useMemo } from "react";
import { Circle } from "@phosphor-icons/react";
import { parseFrontmatter } from "@app/indexer";
import type { GraphIndex } from "@app/indexer";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

const LazyAIStatusIndicator = React.lazy(() => import("../../ai/AIStatusIndicator").then((module) => ({ default: module.AIStatusIndicator })));

export interface StatusBarProps {
  vaultName: string;
  activeNotePath: string | null;
  content: string;
  graph: GraphIndex | null;
  aiCloudEnabled?: boolean;
  aiProviderName?: string;
  aiTransmitting?: boolean;
}

export function computeNoteStats(content: string) {
  if (!content) {
    return { wordCount: 0, charCount: 0, propertyCount: 0 };
  }

  const { frontmatter, content: body } = parseFrontmatter(content);
  const propertyCount = Object.keys(frontmatter).length;

  const cleanText = body
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[\[(.*?)\]\]/g, "$1")
    .trim();
  const charCount = cleanText.length;
  const wordCount = cleanText
    ? cleanText.split(/\s+/).filter(Boolean).length
    : 0;

  return { wordCount, charCount, propertyCount };
}

export function StatusBar({
  vaultName,
  activeNotePath,
  content,
  graph,
  aiCloudEnabled = false,
  aiProviderName = "AI",
  aiTransmitting = false,
}: StatusBarProps) {
  const useVimMode = useWorkspaceStore((state) => state.useVimMode);
  const vimModeState = useWorkspaceStore((state) => state.vimModeState);
  const isCanvas = activeNotePath?.endsWith(".canvas") ?? false;

  const stats = useMemo(
    () => (isCanvas ? null : computeNoteStats(content)),
    [content, isCanvas],
  );

  const backlinkCount = useMemo(() => {
    if (!activeNotePath || !graph || isCanvas) return 0;
    return graph.backlinks.get(activeNotePath)?.length ?? 0;
  }, [activeNotePath, graph, isCanvas]);

  return (
    <footer className="status-bar" role="status" aria-label="Status bar">
      <div className="status-bar__left">
        <span className="status-bar__vault-indicator" aria-hidden="true">
          <Circle size={6} weight="fill" />
        </span>
        <span className="status-bar__vault-name">{vaultName}</span>
        {aiCloudEnabled && <React.Suspense fallback={null}><LazyAIStatusIndicator providerName={aiProviderName} transmitting={aiTransmitting} /></React.Suspense>}
      </div>

      {activeNotePath ? (
        isCanvas ? (
          <div className="status-bar__right">
            <span className="status-bar__stat">Canvas file</span>
          </div>
        ) : (
          <div className="status-bar__right">
            {useVimMode && vimModeState && (
              <>
                <span
                  className="status-bar__stat status-bar__vim-mode"
                  data-testid="status-bar-vim-mode"
                >
                  {vimModeState}
                </span>
                <span className="status-bar__divider">·</span>
              </>
            )}
            <span className="status-bar__stat">
              {backlinkCount} {backlinkCount === 1 ? "backlink" : "backlinks"}
            </span>
            <span className="status-bar__divider">·</span>
            <span className="status-bar__stat">
              {stats!.propertyCount}{" "}
              {stats!.propertyCount === 1 ? "property" : "properties"}
            </span>
            <span className="status-bar__divider">·</span>
            <span className="status-bar__stat">
              {stats!.wordCount} {stats!.wordCount === 1 ? "word" : "words"}
            </span>
            <span className="status-bar__divider">·</span>
            <span className="status-bar__stat">
              {stats!.charCount.toLocaleString()}{" "}
              {stats!.charCount === 1 ? "character" : "characters"}
            </span>
          </div>
        )
      ) : (
        <div className="status-bar__right">
          <span className="status-bar__stat">No file open</span>
        </div>
      )}
    </footer>
  );
}
