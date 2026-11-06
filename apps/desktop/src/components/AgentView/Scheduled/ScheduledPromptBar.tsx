import { useState } from "react";
import { ArrowUp, Plus } from "@phosphor-icons/react";
import styles from "./ScheduledPromptBar.module.scss";

export interface ScheduledPromptBarProps {
  onSubmit: (text: string) => void;
  onOpenBlank: () => void;
}

export function ScheduledPromptBar({ onSubmit, onOpenBlank }: ScheduledPromptBarProps) {
  const [value, setValue] = useState("");
  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  };

  return (
    <form
      className={styles["prompt-bar"]}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <button
        type="button"
        className={styles["prompt-bar__plus"]}
        onClick={onOpenBlank}
        aria-label="New scheduled task"
      >
        <Plus size={20} />
      </button>
      <input
        className={styles["prompt-bar__input"]}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Schedule a task"
        aria-label="Schedule a task"
      />
      <button
        type="submit"
        className={styles["prompt-bar__send"]}
        disabled={!value.trim()}
        aria-label="Create schedule"
      >
        <ArrowUp size={16} weight="bold" />
      </button>
    </form>
  );
}
