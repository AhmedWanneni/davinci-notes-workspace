import {
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import type { LibraryItem } from "@app/ai-agent";
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

  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const [slashStartIndex, setSlashStartIndex] = useState<number>(-1);
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [slashItemCount, setSlashItemCount] = useState(0);

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    const cursor = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, cursor);

    // Check @ mention
    const atMatch = /(?:^|\s)@([^\s@]*)$/.exec(textBefore);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionStartIndex(cursor - atMatch[1].length - 1);
      setMentionSelectedIndex(0);
      setSlashQuery(null);
      setSlashStartIndex(-1);
      return;
    }
    setMentionQuery(null);
    setMentionStartIndex(-1);

    // Check / slash command & prompt template
    const slashMatch = /(?:^|\s)\/([^\s/]*)$/.exec(textBefore);
    if (slashMatch) {
      setSlashQuery(slashMatch[1]);
      setSlashStartIndex(cursor - slashMatch[1].length - 1);
      setSlashSelectedIndex(0);
      return;
    }
    setSlashQuery(null);
    setSlashStartIndex(-1);
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

  const handleSelectSlash = (item: LibraryItem) => {
    if (slashStartIndex === -1) return;
    const before = input.slice(0, slashStartIndex);
    const cursor = textareaRef.current?.selectionStart ?? input.length;
    const after = input.slice(cursor);

    let text = item.content;
    if (item.type === "rule") {
      text = `[Rule: ${item.title}]\n${item.content}`;
    } else if (item.type === "skill") {
      text = `[Skill: ${item.title}]\n${item.content}`;
    }

    const inserted = `${text} `;
    const nextVal = `${before}${inserted}${after}`;
    setInput(nextVal);
    setSlashQuery(null);
    setSlashStartIndex(-1);

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
    // 1. Handle Slash Menu Navigation
    if (slashQuery !== null && slashItemCount > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev + 1) % slashItemCount);
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashSelectedIndex((prev) =>
          prev === 0 ? slashItemCount - 1 : prev - 1,
        );
        return true;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selectedEl = document.querySelector(
          "[role='listbox'][aria-label*='library'] [aria-selected='true']",
        ) as HTMLElement | null;
        if (selectedEl) {
          selectedEl.click();
          return true;
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashQuery(null);
        return true;
      }
    }

    // 2. Handle Mention Menu Navigation
    if (mentionQuery !== null && mentionItemCount > 0) {
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
    }

    return false;
  };

  return {
    mentionQuery,
    mentionSelectedIndex,
    setMentionQuery,
    setMentionItemCount,
    slashQuery,
    slashSelectedIndex,
    setSlashQuery,
    setSlashItemCount,
    handleInputChange,
    handleSelectMention,
    handleSelectSlash,
    handleMentionKeyDown,
  };
}
