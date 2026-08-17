import { memo, useMemo, type JSX, type MouseEvent } from "react";
import {
  ArrowSquareOut,
  Globe,
  PencilSimple,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { extractDomain, isYouTubeUrl } from "./linkCardUtils";
import styles from "./LinkCardNode.module.scss";

export interface LinkCardHeaderProps {
  url: string;
  isEditingUrl: boolean;
  onToggleEditUrl: () => void;
  onOpenExternal: (event: MouseEvent) => void;
}

function LinkCardHeaderComponent({
  url,
  isEditingUrl,
  onToggleEditUrl,
  onOpenExternal,
}: LinkCardHeaderProps): JSX.Element {
  const domain = useMemo(() => extractDomain(url), [url]);
  const isYouTube = useMemo(() => isYouTubeUrl(url), [url]);

  return (
    <div className={`${styles["link-card__header"]} nodrag`}>
      <div className={styles["link-card__title-group"]} title={url}>
        <span className={styles["link-card__icon"]}>
          {isYouTube ? (
            <YoutubeLogo size={14} weight="bold" />
          ) : (
            <Globe size={14} weight="bold" />
          )}
        </span>
        <span className={styles["link-card__domain"]}>
          {domain || "No URL"}
        </span>
      </div>

      <div className={styles["link-card__actions"]}>
        <button
          type="button"
          className={`${styles["link-card__action-btn"]} ${
            isEditingUrl ? styles["is-active"] : ""
          }`}
          onClick={onToggleEditUrl}
          title="Change URL"
          aria-label="Change URL"
          data-testid="link-card-edit-url-btn"
        >
          <PencilSimple size={13} />
        </button>

        <button
          type="button"
          className={styles["link-card__action-btn"]}
          onClick={onOpenExternal}
          title="Open in browser"
          aria-label="Open in browser"
          data-testid="link-card-open-external-btn"
          disabled={!url}
        >
          <ArrowSquareOut size={13} />
        </button>
      </div>
    </div>
  );
}

export const LinkCardHeader = memo(LinkCardHeaderComponent);
