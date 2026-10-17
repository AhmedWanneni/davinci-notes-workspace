import React, { useMemo } from "react";
import { parseFrontmatter } from "@app/indexer";
import type { GraphIndex } from "@app/indexer";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

const LazyAIStatusIndicator = React.lazy(() =>
  import("../../ai/AIStatusIndicator").then((module) => ({
    default: module.AIStatusIndicator,
  })),
);

export interface StatusBarProps {
  vaultName?: string;
  activeNotePath: string | null;
  content: string;
  graph?: GraphIndex | null;
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
  activeNotePath,
  content,
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

  return (
    <>
      <div className="status-bar__left">
        {aiCloudEnabled && (
          <React.Suspense fallback={null}>
            <LazyAIStatusIndicator
              providerName={aiProviderName}
              transmitting={aiTransmitting}
            />
          </React.Suspense>
        )}
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
              {stats!.wordCount} {stats!.wordCount === 1 ? "word" : "words"}
            </span>
            <span className="status-bar__divider">·</span>
            <span className="status-bar__stat">
              {stats!.charCount.toLocaleString()}{" "}
              {stats!.charCount === 1 ? "character" : "characters"}
            </span>
          </div>
        )
      ) : null}
    </>
  );
}
