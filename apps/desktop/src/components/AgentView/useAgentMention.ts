import {
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import type { MentionItem } from "./agentTypes";

export function useAgentMention(
  input: string,
  setInput: (val: string) => void,
  textareaRef: RefObject<HTMLTextAreaElement | null>,
) {
  const [mentions, setMentions] = useState<MentionItem[]>([]);
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

  const removeMention = (id: string) => {
    setMentions((prev) => prev.filter((m) => m.id !== id));
  };

  const clearMentions = () => {
    setMentions([]);
  };

  const handleSelectMention = (item: MentionItem) => {
    setMentions((prev) =>
      prev.some((m) => m.id === item.id) ? prev : [...prev, item],
    );

    if (mentionStartIndex !== -1) {
      const before = input.slice(0, mentionStartIndex);
      const cursor = textareaRef.current?.selectionStart ?? input.length;
      const after = input.slice(cursor);
      const combined = `${before}${after}`.replace(/\s+$/, "");
      const nextVal = combined ? `${combined} ` : "";
      setInput(nextVal);
    }

    setMentionQuery(null);
    setMentionStartIndex(-1);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleMentionKeyDown = (
    e: KeyboardEvent<HTMLTextAreaElement>,
  ): boolean => {
    if (e.key === "Backspace" && input === "" && mentions.length > 0) {
      setMentions((prev) => prev.slice(0, -1));
      return true;
    }

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
    mentions,
    setMentions,
    removeMention,
    clearMentions,
    mentionQuery,
    mentionSelectedIndex,
    setMentionQuery,
    setMentionItemCount,
    handleInputChange,
    handleSelectMention,
    handleMentionKeyDown,
  };
}
