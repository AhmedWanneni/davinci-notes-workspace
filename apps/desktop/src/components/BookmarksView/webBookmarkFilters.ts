import type {
  WebBookmarkItem,
  WebBookmarkSortOption,
} from "../../bookmarks/bookmarkTypes";

export type SidebarSection =
  | { type: "all" }
  | { type: "unsorted" }
  | { type: "trash" }
  | { type: "collection"; folder: string }
  | {
      type: "filter";
      filter:
        | "highlights"
        | "links"
        | "articles"
        | "images"
        | "videos"
        | "audios"
        | "documents"
        | "without-tags";
    };

export interface BookmarkCounts {
  all: number;
  unsorted: number;
  trash: number;
  collections: [string, number][];
  highlights: number;
  links: number;
  articles: number;
  images: number;
  videos: number;
  audios: number;
  documents: number;
  withoutTags: number;
}

export function computeBookmarkCounts(
  items: readonly WebBookmarkItem[],
): BookmarkCounts {
  let all = 0;
  let unsorted = 0;
  let trash = 0;
  let highlights = 0;
  let links = 0;
  let articles = 0;
  let images = 0;
  let videos = 0;
  let audios = 0;
  let documents = 0;
  let withoutTags = 0;
  const colMap = new Map<string, number>();

  for (const item of items) {
    if (item.trashed) {
      trash += 1;
      continue;
    }
    all += 1;
    if (!item.folder) {
      unsorted += 1;
    } else {
      colMap.set(item.folder, (colMap.get(item.folder) ?? 0) + 1);
    }
    if ((item.highlights?.length ?? 0) > 0) highlights += 1;
    if (!item.tags || item.tags.length === 0) withoutTags += 1;

    switch (item.type) {
      case "article":
        articles += 1;
        break;
      case "image":
        images += 1;
        break;
      case "video":
        videos += 1;
        break;
      case "audio":
        audios += 1;
        break;
      case "document":
        documents += 1;
        break;
      default:
        links += 1;
        break;
    }
  }

  return {
    all,
    unsorted,
    trash,
    collections: Array.from(colMap.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    ),
    highlights,
    links,
    articles,
    images,
    videos,
    audios,
    documents,
    withoutTags,
  };
}

export function filterAndSortBookmarks(
  items: readonly WebBookmarkItem[],
  section: SidebarSection,
  searchQuery: string,
  sortOption: WebBookmarkSortOption,
): WebBookmarkItem[] {
  const query = searchQuery.trim().toLowerCase();
  const tagFilter = query.startsWith("#") ? query.slice(1) : null;

  const filtered = items.filter((item) => {
    if (section.type === "trash") {
      if (!item.trashed) return false;
    } else {
      if (item.trashed) return false;

      if (section.type === "unsorted" && item.folder) return false;
      if (section.type === "collection" && item.folder !== section.folder) {
        return false;
      }
      if (section.type === "filter") {
        if (
          section.filter === "highlights" &&
          (!item.highlights || item.highlights.length === 0)
        ) {
          return false;
        }
        if (
          section.filter === "without-tags" &&
          item.tags &&
          item.tags.length > 0
        ) {
          return false;
        }
        if (section.filter === "links" && item.type && item.type !== "link") {
          return false;
        }
        if (
          ["articles", "images", "videos", "audios", "documents"].includes(
            section.filter,
          )
        ) {
          const typeMap: Record<string, string> = {
            articles: "article",
            images: "image",
            videos: "video",
            audios: "audio",
            documents: "document",
          };
          if (item.type !== typeMap[section.filter]) return false;
        }
      }
    }

    if (!query) return true;
    if (tagFilter) {
      return (item.tags ?? []).some((t) => t.toLowerCase().includes(tagFilter));
    }
    return (
      item.title.toLowerCase().includes(query) ||
      item.url.toLowerCase().includes(query) ||
      (item.domain ?? "").toLowerCase().includes(query) ||
      (item.folder ?? "").toLowerCase().includes(query) ||
      (item.description ?? "").toLowerCase().includes(query) ||
      (item.note ?? "").toLowerCase().includes(query) ||
      (item.tags ?? []).some((t) => t.toLowerCase().includes(query))
    );
  });

  return [...filtered].sort((a, b) => {
    switch (sortOption) {
      case "date-asc":
        return a.addedAt - b.addedAt;
      case "name-asc":
      case "alpha":
        return a.title.localeCompare(b.title);
      case "name-desc":
        return b.title.localeCompare(a.title);
      case "domain-asc":
      case "domain":
        return (a.domain ?? a.url).localeCompare(b.domain ?? b.url);
      case "domain-desc":
        return (b.domain ?? b.url).localeCompare(a.domain ?? a.url);
      case "recent":
      case "date-desc":
      default:
        return b.addedAt - a.addedAt;
    }
  });
}
