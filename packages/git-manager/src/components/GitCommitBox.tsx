import { useState, type KeyboardEvent } from "react";
import { Check, CaretDown } from "@phosphor-icons/react";
import {
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@app/design-system";
import { useGitManagerStore } from "../store/useGitManagerStore";
import styles from "./GitCommitBox.module.scss";

export interface GitCommitBoxProps {
  onCommitSuccess?: () => void;
}

export function GitCommitBox({ onCommitSuccess }: GitCommitBoxProps) {
  const [message, setMessage] = useState("");
  const [isAmend, setIsAmend] = useState(false);
  const { staged, commit, isLoading } = useGitManagerStore();

  const canCommit = message.trim().length > 0 && (staged.length > 0 || isAmend);

  const handleCommit = async () => {
    if (!canCommit || isLoading) return;
    const hash = await commit(message.trim(), isAmend);
    if (hash) {
      setMessage("");
      if (isAmend) setIsAmend(false);
      onCommitSuccess?.();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleCommit();
    }
  };

  return (
    <div className={styles["git-commit-box"]} data-testid="git-commit-box">
      <div className={styles["git-commit-box__header"]}>
        <span className={styles["git-commit-box__title"]}>Commit</span>
        {isAmend && (
          <Badge
            variant="warning"
            className={styles["git-commit-box__amend-badge"]}
            onClick={() => setIsAmend(false)}
            title="Click to cancel amend mode"
          >
            Amend Mode ✕
          </Badge>
        )}
      </div>

      <textarea
        className={styles["git-commit-box__textarea"]}
        placeholder="Message (⌘Enter to commit)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        rows={3}
        data-testid="git-commit-message-input"
      />

      <div className={styles["git-commit-box__actions"]}>
        <Button
          variant="primary"
          size="sm"
          className={styles["git-commit-box__commit-btn"]}
          onClick={() => void handleCommit()}
          disabled={!canCommit || isLoading}
          data-testid="git-commit-submit-btn"
        >
          <Check size={14} weight="bold" />
          <span>{isAmend ? "Amend Commit" : "Commit"}</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="primary"
              size="sm"
              className={styles["git-commit-box__dropdown-btn"]}
              disabled={isLoading}
              aria-label="Commit options"
            >
              <CaretDown size={12} weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => void handleCommit()} disabled={!canCommit}>
              Commit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setIsAmend(!isAmend)}>
              {isAmend ? "Disable Amend" : "Amend Previous Commit"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
