import React from "react";
import {
  Highlighter,
  LinkSimple,
  Article,
  ImageSquare,
  PlayCircle,
  MusicNotes,
  FileText,
  Hash,
} from "@phosphor-icons/react";
import type { BookmarkCounts, SidebarSection } from "./webBookmarkFilters";
import styles from "./WebBookmarksSidebar.module.scss";

export interface WebBookmarksSidebarFiltersProps {
  counts: BookmarkCounts;
  isSectionActive: (s: SidebarSection) => boolean;
  onSelectSection: (s: SidebarSection) => void;
}

export function WebBookmarksSidebarFilters({
  counts,
  isSectionActive,
  onSelectSection,
}: WebBookmarksSidebarFiltersProps) {
  const filterList = [
    {
      id: "highlights" as const,
      label: "Highlights",
      count: counts.highlights,
      icon: <Highlighter size={16} weight="regular" />,
    },
    {
      id: "links" as const,
      label: "Links",
      count: counts.links,
      icon: <LinkSimple size={16} weight="regular" />,
    },
    {
      id: "articles" as const,
      label: "Articles",
      count: counts.articles,
      icon: <Article size={16} weight="regular" />,
    },
    {
      id: "images" as const,
      label: "Images",
      count: counts.images,
      icon: <ImageSquare size={16} weight="regular" />,
    },
    {
      id: "videos" as const,
      label: "Videos",
      count: counts.videos,
      icon: <PlayCircle size={16} weight="regular" />,
    },
    {
      id: "audios" as const,
      label: "Audios",
      count: counts.audios,
      icon: <MusicNotes size={16} weight="regular" />,
    },
    {
      id: "documents" as const,
      label: "Documents",
      count: counts.documents,
      icon: <FileText size={16} weight="regular" />,
    },
    {
      id: "without-tags" as const,
      label: "Without tags",
      count: counts.withoutTags,
      icon: <Hash size={16} weight="regular" />,
    },
  ];

  return (
    <div className={styles["wb-sidebar__group"]}>
      <div className={styles["wb-sidebar__group-title"]}>Filters</div>
      {filterList
        .filter(
          (f) => f.count > 0 || f.id === "without-tags" || f.id === "links",
        )
        .map((f) => {
          const active = isSectionActive({
            type: "filter",
            filter: f.id,
          });
          return (
            <button
              key={f.id}
              type="button"
              className={`${styles["wb-sidebar__item"]} ${
                active ? styles["is-active"] : ""
              }`}
              onClick={() => onSelectSection({ type: "filter", filter: f.id })}
            >
              <span className={styles["wb-sidebar__item-left"]}>
                {f.icon}
                <span className={styles["wb-sidebar__item-label"]}>
                  {f.label}
                </span>
              </span>
              <span className={styles["wb-sidebar__item-count"]}>
                {f.count}
              </span>
            </button>
          );
        })}
    </div>
  );
}
