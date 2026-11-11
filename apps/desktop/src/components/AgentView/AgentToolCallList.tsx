import { useState } from "react";
import {
  Wrench,
  CheckCircle,
  WarningCircle,
  FolderOpen,
  FileText,
  ArrowRight,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { invoke } from "@tauri-apps/api/core";
import type { AgentToolCall, AgentToolResult } from "@app/ai-api";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

export interface AgentToolCallListProps {
  toolCalls: AgentToolCall[];
  toolResults?: AgentToolResult[];
  onNavigateNote?: (notePath: string) => void;
  onNavigateFolder?: (folderPath: string) => void;
}

function formatToolCallSummary(
  name: string,
  args: Record<string, unknown>,
): string {
  if (name === "create_folder" && args.path)
    return `Folder created: "${args.path}"`;
  if (name === "read_note" && args.path) return `Read note "${args.path}"`;
  if (name === "search_vault" && args.query)
    return `Search vault for "${args.query}"`;
  if (name === "create_note" && args.path) return `Created note "${args.path}"`;
  if ((name === "edit_note" || name === "append_to_note") && args.path)
    return `Updated note "${args.path}"`;
  if (name === "delete_note" && args.path) return `Deleted note "${args.path}"`;
  if (name === "move_note" && args.fromPath && args.toPath)
    return `Moved "${args.fromPath}" → "${args.toPath}"`;
  if (name === "web_search" && args.query) return `Web search: "${args.query}"`;
  if (name === "save_memory" && args.content)
    return `Saved memory: "${args.content}"`;
  if (name === "calendar_list_events") return "Check calendar events";
  if (name === "calendar_create_event" && args.summary)
    return `Add calendar event: "${args.summary}"`;
  if (name === "calendar_sync_tasks")
    return "Export task reminders to Calendar";
  if (name === "wiki_synthesize_topic" && args.topic)
    return `Synthesize wiki topic: "${args.topic}"`;
  if (name === "wiki_update_index") return "Update Wiki Index (MOC)";
  return name;
}

export function AgentToolCallList({
  toolCalls,
  toolResults = [],
  onNavigateNote,
  onNavigateFolder,
}: AgentToolCallListProps) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const allNotePaths = useWorkspaceStore((s) => s.allNotePaths);
  const vaultPath = useWorkspaceStore((s) => s.vaultPath);

  if (!toolCalls || toolCalls.length === 0) return null;

  const handleFolderClick = (folderPath: string) => {
    const clean = folderPath.trim().replace(/^\/+|\/+$/g, "");
    if (!clean) return;
    setOpenFolders((prev) => ({ ...prev, [clean]: !prev[clean] }));
    if (onNavigateFolder) {
      onNavigateFolder(clean);
    } else {
      useWorkspaceStore.getState().revealFolderInTree(clean);
    }
  };

  const handleNoteClick = (notePath: string) => {
    const clean = notePath.trim().replace(/^\/+/, "");
    if (!clean) return;
    if (onNavigateNote) {
      onNavigateNote(clean);
    } else {
      void useWorkspaceStore.getState().openNote(clean);
    }
  };

  const handleRevealInFinder = (e: React.MouseEvent, relativePath: string) => {
    e.stopPropagation();
    if (!vaultPath) return;
    const fullPath = `${vaultPath.replace(/\/+$/, "")}/${relativePath.replace(/^\/+/, "")}`;
    void invoke("show_in_folder", { path: fullPath }).catch(() => {});
  };

  return (
    <div className="agent-message__tools">
      {toolCalls.map((tc) => {
        const args = (tc.arguments ?? {}) as Record<string, unknown>;
        const result = toolResults.find((r) => r.toolCallId === tc.id);
        const isError = result?.isError;
        const isFolderAction = tc.name === "create_folder" && Boolean(args.path);
        const isNoteAction =
          (tc.name === "create_note" ||
            tc.name === "edit_note" ||
            tc.name === "append_to_note" ||
            tc.name === "read_note" ||
            tc.name === "move_note") &&
          Boolean(args.toPath || args.path);

        const statusIcon = isError ? (
          <WarningCircle size={13} weight="fill" className="agent-tool-card__icon--error" />
        ) : (
          <CheckCircle size={13} weight="fill" className="agent-tool-card__icon--success" />
        );

        if (isFolderAction) {
          const folderPath = String(args.path).trim().replace(/^\/+|\/+$/g, "");
          const prefix = `${folderPath}/`;
          const folderNotes = allNotePaths.filter((p) => p.startsWith(prefix));
          const isOpened = Boolean(openFolders[folderPath]);

          return (
            <div key={tc.id} className="agent-tool-card" data-error={isError || undefined}>
              <button
                type="button"
                className="agent-tool-card__header agent-tool-card__action-btn"
                onClick={() => handleFolderClick(folderPath)}
                title={`Open folder "${folderPath}" in vault`}
              >
                <span className="agent-tool-card__icon" aria-hidden="true">
                  <FolderOpen size={15} weight="duotone" />
                </span>
                <span className="agent-tool-card__name">{formatToolCallSummary(tc.name, args)}</span>
                <span className="agent-tool-card__link-label">
                  Open folder <ArrowRight size={11} weight="bold" />
                </span>
                <span className="agent-tool-card__status">{statusIcon}</span>
              </button>
              {isOpened && (
                <div className="agent-tool-card__folder-contents">
                  {folderNotes.length > 0 ? (
                    folderNotes.map((nPath) => (
                      <button
                        key={nPath}
                        type="button"
                        className="agent-tool-card__folder-item"
                        onClick={() => handleNoteClick(nPath)}
                      >
                        <FileText size={13} />
                        <span>{nPath.slice(prefix.length)}</span>
                        <span className="agent-tool-card__link-label">Open note →</span>
                      </button>
                    ))
                  ) : (
                    <div className="agent-tool-card__folder-empty">
                      Folder opened in File Explorer ({folderPath}/)
                    </div>
                  )}
                  {vaultPath && (
                    <button
                      type="button"
                      className="agent-tool-card__folder-item"
                      onClick={(e) => handleRevealInFinder(e, folderPath)}
                    >
                      <ArrowSquareOut size={13} />
                      <span>Reveal in system file manager</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        }

        if (isNoteAction) {
          const notePath = String(args.toPath || args.path).trim();
          return (
            <div key={tc.id} className="agent-tool-card" data-error={isError || undefined}>
              <button
                type="button"
                className="agent-tool-card__header agent-tool-card__action-btn"
                onClick={() => handleNoteClick(notePath)}
                title={`Open note "${notePath}"`}
              >
                <span className="agent-tool-card__icon" aria-hidden="true">
                  <FileText size={15} weight="duotone" />
                </span>
                <span className="agent-tool-card__name">{formatToolCallSummary(tc.name, args)}</span>
                <span className="agent-tool-card__link-label">
                  Open note <ArrowRight size={11} weight="bold" />
                </span>
                <span className="agent-tool-card__status">{statusIcon}</span>
              </button>
            </div>
          );
        }

        return (
          <details key={tc.id} className="agent-tool-card" data-error={isError || undefined}>
            <summary className="agent-tool-card__header">
              <span className="agent-tool-card__icon" aria-hidden="true">
                <Wrench size={13} weight="bold" />
              </span>
              <span className="agent-tool-card__name">{formatToolCallSummary(tc.name, args)}</span>
              {result && <span className="agent-tool-card__status">{statusIcon}</span>}
            </summary>
            <pre className="agent-tool-card__args">{JSON.stringify(tc.arguments, null, 2)}</pre>
          </details>
        );
      })}
    </div>
  );
}
