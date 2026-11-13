import { useState, useEffect, useCallback } from "react";
import { loadTreeIcons, persistTreeIcon } from "./treeIconStorage";
import { isEmojiIcon } from "./isEmojiIcon";

export interface UseTreeIconsResult {
  icons: Record<string, string>;
  setIcon: (path: string, emoji: string | null) => Promise<void>;
  isLoading: boolean;
}

export function useTreeIcons(): UseTreeIconsResult {
  const [icons, setIcons] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    void loadTreeIcons().then((loaded) => {
      if (active) {
        setIcons(loaded);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const setIcon = useCallback(async (path: string, emoji: string | null) => {
    if (emoji !== null && !isEmojiIcon(emoji)) return;
    setIcons((prev) => {
      const next = { ...prev };
      if (emoji === null) delete next[path];
      else next[path] = emoji;
      void persistTreeIcon(path, emoji, prev);
      return next;
    });
  }, []);

  return { icons, setIcon, isLoading };
}
