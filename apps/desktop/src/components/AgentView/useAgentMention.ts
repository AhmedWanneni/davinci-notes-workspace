import { useState, type ChangeEvent, type KeyboardEvent, type RefObject } from "react";
import type { MentionItem } from "./AgentMentionMenu";

export function useAgentMention(
  input: string,
  setInput: (val: string) => void,
  textareaRef: RefObject<HTMLTextAreaElement | null>,
) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentionItemCount, setMentionItemCount] = useState(0);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    const cursor = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, cursor);
    const match = /(?:^|\s)@([^\s@]*)$/.exec(textBefore);
    if (match) {
      setMentionQuery(match[1]);
      setMentionStartIndex(cursor - match[1].length - 1);
      setMentionSelectedIndex(0);
    } else {
      setMentionQuery(null);
      setMentionStartIndex(-1);
    }
  };

  const handleSelectMention = (item: MentionItem) => {
    if (mentionStartIndex === -1) return;
    const before = input.slice(0, mentionStartIndex);
    const cursor = textareaRef.current?.selectionStart ?? input.length;
    const after = input.slice(cursor);
    const inserted = `@${item.path} `;
    const nextVal = `${before}${inserted}${after}`;
    setInput(nextVal);
    setMentionQuery(null);
    setMentionStartIndex(-1);

    setTimeout(() => {
      if (textareaRef.current) {
        const nextPos = before.length + inserted.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 0);
  };

  const handleMentionKeyDown = (
    e: KeyboardEvent<HTMLTextAreaElement>,
  ): boolean => {
    if (mentionQuery === null || mentionItemCount === 0) return false;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionSelectedIndex((prev) => (prev + 1) % mentionItemCount);
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionSelectedIndex((prev) =>
        prev === 0 ? mentionItemCount - 1 : prev - 1,
      );
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const selectedEl = document.querySelector(
        ".agent-mention-menu [aria-selected='true']",
      ) as HTMLElement | null;
      if (selectedEl) {
        selectedEl.click();
        return true;
      }
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setMentionQuery(null);
      return true;
    }
    return false;
  };

  return {
    mentionQuery,
    mentionSelectedIndex,
    setMentionQuery,
    setMentionItemCount,
    handleInputChange,
    handleSelectMention,
    handleMentionKeyDown,
  };
}
