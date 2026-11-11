import React, { useState } from "react";
import { FileText, Globe } from "@phosphor-icons/react";
import {
  extractDomainFromUrl,
  getWebsiteCoverUrl,
  getWebsiteFaviconUrl,
} from "../../bookmarks/bookmarkStorage";
import styles from "./WebBookmarksDisplay.module.scss";

export interface WebBookmarkCoverProps {
  url: string;
  cover?: string;
  favicon?: string;
  title?: string;
  className?: string;
  imgClassName?: string;
  placeholderClassName?: string;
}

export function WebBookmarkCover({
  url,
  cover,
  favicon,
  title,
  className,
  imgClassName,
  placeholderClassName,
}: WebBookmarkCoverProps) {
  const primaryCover = cover || getWebsiteCoverUrl(url);
  const fallbackFavicon = favicon || getWebsiteFaviconUrl(url);
  const [imgSrc, setImgSrc] = useState<string>(primaryCover);
  const [fallbackLevel, setFallbackLevel] = useState<0 | 1 | 2>(
    primaryCover ? 0 : fallbackFavicon ? 1 : 2,
  );

  const domain = extractDomainFromUrl(url) || "";
  const isWebUrl = /^https?:\/\//i.test(url.trim());

  const handleError = () => {
    if (fallbackLevel === 0 && fallbackFavicon && fallbackFavicon !== imgSrc) {
      setFallbackLevel(1);
      setImgSrc(fallbackFavicon);
    } else {
      setFallbackLevel(2);
    }
  };

  if (fallbackLevel === 2 || !imgSrc) {
    return (
      <div
        className={`${styles["wb-cover-placeholder"]} ${placeholderClassName ?? ""}`}
        aria-hidden="true"
      >
        {isWebUrl ? (
          <Globe size={24} weight="regular" />
        ) : (
          <FileText size={24} weight="regular" />
        )}
        {isWebUrl && domain && (
          <span className={styles["wb-cover-domain"]}>{domain}</span>
        )}
      </div>
    );
  }

  if (fallbackLevel === 1) {
    return (
      <div
        className={`${styles["wb-cover-favicon-wrap"]} ${className ?? ""}`}
        aria-hidden="true"
      >
        <img
          src={imgSrc}
          alt=""
          className={styles["wb-cover-favicon-img"]}
          loading="lazy"
          onError={handleError}
        />
        {domain && <span className={styles["wb-cover-domain"]}>{domain}</span>}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={title ? `Cover for ${title}` : "Website cover"}
      className={`${styles["wb-cover-img"]} ${imgClassName ?? ""}`}
      loading="lazy"
      onError={handleError}
    />
  );
}
