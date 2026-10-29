import { useState, type KeyboardEvent } from "react";
import { Check, CaretDown, Sparkle } from "@phosphor-icons/react";
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
  placeholder?: string;
  onCommitSuccess?: () => void;
}

export function GitCommitBox({
  placeholder,
  onCommitSuccess,
}: GitCommitBoxProps) {
  const [message, setMessage] = useState("");
  const [isAmend, setIsAmend] = useState(false);
  const { staged, commit, isLoading, repoInfo } = useGitManagerStore();

  const branchName = repoInfo?.branch;
  const placeholderText =
    placeholder ??
    (branchName
      ? `Message (⌘↩ to commit on "${branchName}")`
      : "Message (⌘Enter to commit)");
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
      {isAmend && (
        <div className={styles["git-commit-box__header"]}>
          <Badge
            variant="warning"
            className={styles["git-commit-box__amend-badge"]}
            onClick={() => setIsAmend(false)}
            title="Click to cancel amend mode"
          >
            Amend Mode ✕
          </Badge>
        </div>
      )}

      <div className={styles["git-commit-box__input-wrapper"]}>
        <textarea
          className={styles["git-commit-box__textarea"]}
          placeholder={placeholderText}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={2}
          data-testid="git-commit-message-input"
        />
        <button
          type="button"
          className={styles["git-commit-box__sparkle-btn"]}
          title="Generate commit message"
          aria-label="Generate commit message"
          onClick={() => {
            if (!message && staged.length > 0) {
              setMessage(
                `chore: update ${staged.map((s) => s.path.split("/").pop()).join(", ")}`,
              );
            }
          }}
        >
          <Sparkle size={14} weight="regular" />
        </button>
      </div>

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
            <DropdownMenuItem
              onSelect={() => void handleCommit()}
              disabled={!canCommit}
            >
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
