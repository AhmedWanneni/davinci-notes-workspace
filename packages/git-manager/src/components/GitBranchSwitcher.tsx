import { useState, useEffect } from "react";
import { GitBranch, CaretDown, Check, Plus, Trash } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@app/design-system";
import type { GitBranchInfo } from "../types/gitTypes";
import {
  fetchGitBranches,
  switchGitBranch,
  createGitBranch,
  deleteGitBranch,
  stashGitChanges,
} from "../api/gitClient";
import styles from "./GitBranchSwitcher.module.scss";

export interface GitBranchSwitcherProps {
  currentBranch: string;
  onBranchSwitched?: () => void;
}

export function GitBranchSwitcher({
  currentBranch,
  onBranchSwitched,
}: GitBranchSwitcherProps) {
  const [branches, setBranches] = useState<GitBranchInfo[]>([]);
  const [filter, setFilter] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const loadBranches = async () => {
    try {
      const list = await fetchGitBranches();
      setBranches(list);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      void loadBranches();
    }
  }, [isOpen]);

  const handleSwitch = async (branchName: string) => {
    try {
      await switchGitBranch(branchName);
      setIsOpen(false);
      onBranchSwitched?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("DIRTY_WORKING_TREE")) {
        const stashAndSwitch = window.confirm(
          "You have uncommitted changes. Stash your changes before switching?"
        );
        if (stashAndSwitch) {
          try {
            await stashGitChanges("Auto-stash before branch switch");
            await switchGitBranch(branchName);
            setIsOpen(false);
            onBranchSwitched?.();
          } catch (innerErr) {
            window.alert(`Failed to switch: ${String(innerErr)}`);
          }
        }
      } else {
        window.alert(`Could not switch branch: ${msg}`);
      }
    }
  };

  const handleCreate = async () => {
    const name = window.prompt("Enter new branch name:");
    if (!name || name.trim().length === 0) return;
    try {
      await createGitBranch(name.trim(), true);
      setIsOpen(false);
      onBranchSwitched?.();
    } catch (err) {
      window.alert(`Could not create branch: ${String(err)}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent, branchName: string) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to delete branch '${branchName}'?`
      )
    ) {
      return;
    }
    try {
      await deleteGitBranch(branchName, true);
      await loadBranches();
    } catch (err) {
      window.alert(`Could not delete branch: ${String(err)}`);
    }
  };

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className={styles["git-branch-switcher"]} data-testid="git-branch-switcher">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={styles["git-branch-switcher__trigger"]}
            aria-label="Switch branch"
          >
            <GitBranch size={16} />
            <span className={styles["git-branch-switcher__name"]}>
              {currentBranch || "Select branch"}
            </span>
            <CaretDown size={12} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className={styles["git-branch-switcher__content"]}>
          <input
            type="text"
            className={styles["git-branch-switcher__search"]}
            placeholder="Search branches..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            data-testid="git-branch-search-input"
          />

          <DropdownMenuSeparator />

          {filteredBranches.map((b) => (
            <DropdownMenuItem
              key={b.name}
              className={`${styles["git-branch-switcher__item"]} ${
                b.isCurrent ? styles["is-current"] : ""
              }`}
              onSelect={() => void handleSwitch(b.name)}
            >
              <div className={styles["git-branch-switcher__item-title"]}>
                {b.isCurrent ? <Check size={14} weight="bold" /> : <GitBranch size={14} />}
                <span>{b.name}</span>
              </div>

              {(b.ahead > 0 || b.behind > 0) && (
                <span className={styles["git-branch-switcher__track"]}>
                  {b.ahead > 0 ? `↑${b.ahead} ` : ""}
                  {b.behind > 0 ? `↓${b.behind}` : ""}
                </span>
              )}

              {!b.isCurrent && !b.isRemote && (
                <button
                  type="button"
                  onClick={(e) => void handleDelete(e, b.name)}
                  title={`Delete ${b.name}`}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
                >
                  <Trash size={12} />
                </button>
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <div
            className={styles["git-branch-switcher__new-btn"]}
            onClick={() => void handleCreate()}
            role="button"
            tabIndex={0}
          >
            <Plus size={14} />
            <span>Create new branch...</span>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
