import { useState, useCallback, useEffect } from "react";
import type { Frontmatter } from "@app/core-types";
import {
  loadNoteCovers,
  persistNoteCover,
  type NoteCoverData,
} from "./noteCoverStorage";
import { stripNoteMetadata } from "./stripNoteMetadata";

export function useNoteCoverImage(
  activeNotePath: string | null,
  content: string,
  frontmatter: Frontmatter,
  updateNoteContent: (path: string, content: string) => void,
) {
  const [covers, setCovers] = useState<Record<string, NoteCoverData>>({});
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadNoteCovers().then((loaded) => {
      if (!cancelled) setCovers(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // If content contains legacy cover or icon lines in editor, clean it immediately
  useEffect(() => {
    if (!activeNotePath || !content) return;
    const stripped = stripNoteMetadata(content);
    if (stripped !== content) {
      updateNoteContent(activeNotePath, stripped);
    }
  }, [activeNotePath, content, updateNoteContent]);

  const activeCoverData = activeNotePath ? covers[activeNotePath] : undefined;

  // Fallback to legacy frontmatter if covers.json does not yet have an entry
  const legacyCoverUrl =
    typeof frontmatter.cover === "string"
      ? (frontmatter.cover as string).trim()
      : typeof frontmatter.banner === "string"
        ? (frontmatter.banner as string).trim()
        : null;

  const coverUrl = activeCoverData ? activeCoverData.url : legacyCoverUrl;

  const legacyCoverY =
    typeof frontmatter.cover_y === "number"
      ? (frontmatter.cover_y as number)
      : typeof frontmatter.banner_y === "number"
        ? (frontmatter.banner_y as number) <= 1
          ? Math.round((frontmatter.banner_y as number) * 100)
          : (frontmatter.banner_y as number)
        : 50;

  const coverY = activeCoverData ? activeCoverData.y : legacyCoverY;

  const handleSetCover = useCallback(
    (newCoverUrl: string, newCoverY = 50) => {
      if (!activeNotePath) return;
      const data: NoteCoverData = { url: newCoverUrl, y: newCoverY };
      setCovers((current) => {
        void persistNoteCover(activeNotePath, data, current).catch(console.error);
        return { ...current, [activeNotePath]: data };
      });
      // Ensure content does not contain cover lines
      const stripped = stripNoteMetadata(content);
      if (stripped !== content) {
        updateNoteContent(activeNotePath, stripped);
      }
    },
    [activeNotePath, content, updateNoteContent],
  );

  const handleRemoveCover = useCallback(() => {
    if (!activeNotePath) return;
    setCovers((current) => {
      void persistNoteCover(activeNotePath, null, current).catch(console.error);
      const next = { ...current };
      delete next[activeNotePath];
      return next;
    });
    const stripped = stripNoteMetadata(content);
    if (stripped !== content) {
      updateNoteContent(activeNotePath, stripped);
    }
  }, [activeNotePath, content, updateNoteContent]);

  const handleSaveCoverPosition = useCallback(
    (newY: number) => {
      if (!activeNotePath || !coverUrl) return;
      const data: NoteCoverData = { url: coverUrl, y: newY };
      setCovers((current) => {
        void persistNoteCover(activeNotePath, data, current).catch(console.error);
        return { ...current, [activeNotePath]: data };
      });
    },
    [activeNotePath, coverUrl],
  );

  return {
    coverUrl,
    coverY,
    isCoverPickerOpen,
    setIsCoverPickerOpen,
    handleSetCover,
    handleRemoveCover,
    handleSaveCoverPosition,
  };
}
