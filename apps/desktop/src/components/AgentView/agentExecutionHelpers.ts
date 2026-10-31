import type { Dispatch, SetStateAction } from "react";
import { CLI_AGENT_CATALOG, type CliAgentId } from "./cliAgentTypes";
import type { ChatMessageItem, ChatAttachmentItem, MentionItem } from "./agentTypes";
import { assembleContextAttachments } from "./agentContextAssembler";

export function appendAssistantChunk(
  prev: ChatMessageItem[],
  assistantMsgId: string,
  chunk: string,
): ChatMessageItem[] {
  const existing = prev.find((m) => m.id === assistantMsgId);
  if (existing) {
    return prev.map((m) =>
      m.id === assistantMsgId
        ? { ...m, content: m.content + chunk, isStreaming: true }
        : m,
    );
  }
  return [
    ...prev,
    {
      id: assistantMsgId,
      role: "assistant",
      content: chunk,
      isStreaming: true,
      timestamp: Date.now(),
    },
  ];
}

export function finalizeAssistantMessage(
  prev: ChatMessageItem[],
  assistantMsgId: string,
  msg: ChatMessageItem,
): ChatMessageItem[] {
  const filtered = prev.filter((m) => m.id !== assistantMsgId);
  return [...filtered, { ...msg, isStreaming: false }];
}

export function createChunkBatcher(
  assistantMsgId: string,
  setMessages: Dispatch<SetStateAction<ChatMessageItem[]>>,
) {
  let chunkBuffer = "";
  let rafId: ReturnType<typeof setTimeout> | number | null = null;

  const scheduleRaf =
    typeof requestAnimationFrame !== "undefined"
      ? requestAnimationFrame
      : (cb: () => void) => setTimeout(cb, 16);

  const cancelRaf =
    typeof cancelAnimationFrame !== "undefined"
      ? cancelAnimationFrame
      : clearTimeout;

  const flush = () => {
    if (!chunkBuffer) return;
    const chunk = chunkBuffer;
    chunkBuffer = "";
    setMessages((prev) => appendAssistantChunk(prev, assistantMsgId, chunk));
  };

  const push = (chunk: string) => {
    chunkBuffer += chunk;
    if (rafId === null) {
      rafId = scheduleRaf(() => {
        rafId = null;
        flush();
      });
    }
  };

  const finish = (msg: ChatMessageItem) => {
    if (rafId !== null) {
      cancelRaf(rafId as number);
      rafId = null;
    }
    flush();
    setMessages((prev) => finalizeAssistantMessage(prev, assistantMsgId, msg));
  };

  return { push, finish, flush };
}

export async function prepareUserMessage(
  promptText: string,
  attachments?: ChatAttachmentItem[],
  mentions?: MentionItem[],
  allNotePaths?: string[],
): Promise<{ userMsg: ChatMessageItem; promptWithContext: string }> {
  const contextXml =
    mentions && mentions.length > 0
      ? await assembleContextAttachments(mentions, { allNotePaths })
      : undefined;

  const userMsg: ChatMessageItem = {
    id: `msg_u_${Date.now()}`,
    role: "user",
    content: promptText,
    attachments,
    mentions,
    mentionsContext: contextXml,
    timestamp: Date.now(),
  };

  const promptWithContext = contextXml
    ? `${contextXml}\n\n${promptText}`
    : promptText;

  return { userMsg, promptWithContext };
}

export function findPriorUserPrompt(
  messages: ChatMessageItem[],
  assistantMsgId: string,
): { prior: ChatMessageItem[]; prompt?: string } | null {
  const idx = messages.findIndex((m) => m.id === assistantMsgId);
  if (idx === -1) return null;
  const userMsg = [...messages.slice(0, idx)]
    .reverse()
    .find((m) => m.role === "user");
  if (!userMsg) return null;
  return { prior: messages.slice(0, idx), prompt: userMsg.content };
}

export function findMessageSlice(
  messages: ChatMessageItem[],
  messageId: string,
): ChatMessageItem[] | null {
  const idx = messages.findIndex((m) => m.id === messageId);
  return idx === -1 ? null : messages.slice(0, idx);
}

export async function executeCliAgentSession(
  agentId: string,
  promptText: string,
  vaultPath: string,
  runCliPrompt: (
    agentId: CliAgentId,
    name: string,
    prompt: string,
    vault: string,
    onOutput: (output: string) => void,
  ) => Promise<void>,
  setMessages: Dispatch<SetStateAction<ChatMessageItem[]>>,
): Promise<void> {
  const meta = CLI_AGENT_CATALOG[agentId as CliAgentId];
  const name = meta?.name || agentId;
  await runCliPrompt(
    agentId as CliAgentId,
    name,
    promptText,
    vaultPath,
    (output) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_a_${Date.now()}`,
          role: "assistant",
          content: output,
          timestamp: Date.now(),
        },
      ]);
    },
  );
}
