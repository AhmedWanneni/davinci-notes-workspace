import type { AgentConversation } from "@app/ai-agent";

export interface ResolveProjectContextParams {
  projectId?: string;
  currentConversationId?: string;
  conversations?: AgentConversation[];
  projectName?: string;
}

export function resolveProjectSisterConversationsContext(
  params: ResolveProjectContextParams,
): string {
  const { projectId, currentConversationId, conversations, projectName } =
    params;

  if (!projectId || !conversations || conversations.length === 0) {
    return "";
  }

  const sisterConvs = conversations
    .filter((c) => c.projectId === projectId && c.id !== currentConversationId)
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 5);

  if (sisterConvs.length === 0) {
    return "";
  }

  const sections: string[] = [];

  for (const conv of sisterConvs) {
    if (!conv.messages || conv.messages.length === 0) continue;

    const recentMsgs = conv.messages
      .filter((m) => m.content && m.content.trim())
      .slice(-6);

    if (recentMsgs.length === 0) continue;

    const convTurns = recentMsgs
      .map((m) => {
        const roleLabel = m.role === "user" ? "User" : "Assistant";
        return `${roleLabel}: ${m.content.trim()}`;
      })
      .join("\n");

    sections.push(`--- Conversation: "${conv.title}" ---\n${convTurns}`);
  }

  if (sections.length === 0) {
    return "";
  }

  const projLabel = projectName ? ` (${projectName})` : "";
  return [
    `[Shared Project Conversations Context${projLabel}]`,
    `The following context is shared from other conversations in this project. Use this information when answering user questions:`,
    sections.join("\n\n"),
  ].join("\n");
}
