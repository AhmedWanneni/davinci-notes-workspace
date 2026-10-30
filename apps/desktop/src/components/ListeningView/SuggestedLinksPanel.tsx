import React from "react";
import { Link as LinkIcon, Check, X } from "@phosphor-icons/react";
import type { SuggestedLinkItem } from "./listeningTypes";
import styles from "./ListeningView.module.scss";

export interface SuggestedLinksPanelProps {
  links: SuggestedLinkItem[];
  isRecording: boolean;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function SuggestedLinksPanel({
  links,
  isRecording,
  onAccept,
  onDismiss,
}: SuggestedLinksPanelProps) {
  const pendingLinks = links.filter((l) => l.accepted === undefined);

  return (
    <div className={styles["notes-card"]} data-testid="suggested-links-panel">
      <h3 className={styles["notes-card__title"]}>
        <LinkIcon size={14} weight="bold" />
        Suggested Vault Links ({pendingLinks.length})
      </h3>

      {pendingLinks.length === 0 ? (
        <p className={styles["notes-card__empty"]}>
          {isRecording
            ? "Searching vault notes matching meeting context..."
            : "Related notes will appear here as you discuss topics."}
        </p>
      ) : (
        <ul
          className={styles["suggested-links-list"]}
          aria-label="Suggested vault links"
        >
          {pendingLinks.map((link) => (
            <li
              key={link.id}
              className={styles["suggested-link-item"]}
              data-testid="suggested-link-item"
            >
              <div className={styles["suggested-link-item__body"]}>
                <span className={styles["suggested-link-item__title"]}>
                  [[{link.title}]]
                </span>
                <span className={styles["suggested-link-item__reason"]}>
                  {link.reason}
                </span>
              </div>
              <div className={styles["suggested-link-item__actions"]}>
                <button
                  type="button"
                  className={styles["action-btn--accept"]}
                  onClick={() => onAccept(link.id)}
                  title={`Accept link to ${link.title}`}
                  aria-label={`Accept link to ${link.title}`}
                >
                  <Check size={13} weight="bold" />
                </button>
                <button
                  type="button"
                  className={styles["action-btn--dismiss"]}
                  onClick={() => onDismiss(link.id)}
                  title={`Dismiss suggestion for ${link.title}`}
                  aria-label={`Dismiss suggestion for ${link.title}`}
                >
                  <X size={13} weight="bold" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
