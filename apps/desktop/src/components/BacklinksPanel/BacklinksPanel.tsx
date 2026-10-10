import React, { useEffect, useState } from "react";
import { Typography } from "@app/design-system";
import { parseLinks } from "@app/indexer";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import {
  getVaultIndexDb,
  queryBacklinkSources,
  readNote,
  withDbLock,
} from "../../vault";
import { EmptyState } from "../EmptyState";

export interface BacklinkItem {
  sourcePath: string;
  sourceTitle: string;
  contextSnippet: string;
  matchText?: string;
}

export interface BacklinksPanelProps {
  activePath: string | null;
  onSelectNote: (path: string) => void;
}

function extractSnippet(
  content: string,
  targetPath: string,
  sourcePath: string,
  allPaths: string[],
): { snippet: string; matchText?: string } {
  const links = parseLinks(content, { sourcePath, notePaths: allPaths });
  const matchingLink = links.find(
    (l) => l.target.toLowerCase() === targetPath.toLowerCase(),
  );

  if (!matchingLink || matchingLink.start === undefined) {
    // Fallback: simple stem match
    const stem =
      targetPath.replace(/\.md$/i, "").split("/").pop() ?? targetPath;
    const lines = content.split("\n");
    const lineIndex = lines.findIndex((l) =>
      l.toLowerCase().includes(stem.toLowerCase()),
    );
    const line = lineIndex !== -1 ? lines[lineIndex] : (lines[0] ?? "");
    return { snippet: line.trim(), matchText: stem };
  }

  const preText = content.substring(0, matchingLink.start);
  const lineIndex = preText.split("\n").length - 1;
  const lines = content.split("\n");
  const line = lines[lineIndex] ?? "";

  const linkRaw = content.substring(matchingLink.start, matchingLink.end);
  return {
    snippet: line.trim(),
    matchText: linkRaw,
  };
}

export function BacklinksPanel({
  activePath,
  onSelectNote,
}: BacklinksPanelProps) {
  const [backlinks, setBacklinks] = useState<BacklinkItem[]>([]);
  const [loading, setLoading] = useState(false);

  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const vaultUpdateCounter = useWorkspaceStore(
    (state) => state.vaultUpdateCounter,
  );

  useEffect(() => {
    if (!activePath) {
      setBacklinks([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function fetchBacklinks() {
      try {
        const db = await getVaultIndexDb();
        const sources = await withDbLock(() =>
          queryBacklinkSources(db, activePath!),
        );

        const items: BacklinkItem[] = await Promise.all(
          sources.map(async (srcPath) => {
            let content = useWorkspaceStore.getState().notesContent[srcPath];
            if (content === undefined) {
              try {
                const res = await readNote(srcPath);
                content = res.content;
              } catch {
                content = "";
              }
            }

            const sourceTitle =
              srcPath.replace(/\.md$/i, "").split("/").pop() ?? srcPath;
            const { snippet, matchText } = extractSnippet(
              content,
              activePath!,
              srcPath,
              allNotePaths,
            );

            return {
              sourcePath: srcPath,
              sourceTitle,
              contextSnippet: snippet,
              matchText,
            };
          }),
        );

        if (isMounted) {
          setBacklinks(items);
        }
      } catch (err) {
        console.error("Failed to query backlinks:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void fetchBacklinks();

    return () => {
      isMounted = false;
    };
  }, [activePath, vaultUpdateCounter, allNotePaths]);

  const renderSnippetWithHighlight = (snippet: string, matchText?: string) => {
    if (!matchText || !snippet.includes(matchText)) {
      return snippet;
    }

    const parts = snippet.split(matchText);
    return (
      <>
        {parts.map((part, idx) => (
          <React.Fragment key={idx}>
            {part}
            {idx < parts.length - 1 && <mark>{matchText}</mark>}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <aside className="backlinks-panel">
      <div className="backlinks-panel__header">
        <Typography variant="h3" size="sm" className="backlinks-panel__title">
          Backlinks
        </Typography>
        {backlinks.length > 0 && (
          <span className="backlinks-panel__count">{backlinks.length}</span>
        )}
      </div>

      <div className="backlinks-panel__content">
        {loading && backlinks.length === 0 ? (
          <EmptyState size="sm" description="Loading backlinks..." />
        ) : backlinks.length === 0 ? (
          <EmptyState size="sm" description="No backlinks yet" />
        ) : (
          backlinks.map((item) => (
            <div
              key={item.sourcePath}
              className="backlinks-panel__card"
              onClick={() => onSelectNote(item.sourcePath)}
            >
              <h4 className="backlinks-panel__source-title">
                {item.sourceTitle}
              </h4>
              <p className="backlinks-panel__snippet">
                {renderSnippetWithHighlight(
                  item.contextSnippet,
                  item.matchText,
                )}
              </p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
