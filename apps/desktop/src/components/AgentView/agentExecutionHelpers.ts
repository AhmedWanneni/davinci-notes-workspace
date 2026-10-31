import type { Dispatch, SetStateAction } from "react";
import { CLI_AGENT_CATALOG, type CliAgentId } from "./cliAgentTypes";
import type { ChatMessageItem } from "./agentTypes";

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
