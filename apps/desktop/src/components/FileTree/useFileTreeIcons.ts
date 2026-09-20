import { useCallback, useEffect, useState } from "react";
import { isEmojiIcon } from "../../icons/isEmojiIcon";
import {
  loadTreeIcons,
  persistTreeIcon,
} from "../../icons/treeIconStorage";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

export function useFileTreeIcons() {
  const vaultPath = useWorkspaceStore((state) => state.vaultPath);
  const [icons, setIcons] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    setIcons({});
    if (!vaultPath) return;
    void loadTreeIcons()
      .then((loaded) => {
        if (!cancelled) setIcons(loaded);
      })
      .catch((error) => {
        console.error("Failed to load file tree icons", error);
      });
    return () => {
      cancelled = true;
    };
  }, [vaultPath]);

  const setIcon = useCallback((path: string, icon: string) => {
    if (!isEmojiIcon(icon)) return;
    setIcons((current) => {
      const next = { ...current, [path]: icon };
      void persistTreeIcon(path, icon, next).catch((error) => {
        console.error("Failed to save file tree icon", error);
      });
      return next;
    });
  }, []);

  return { icons, setIcon };
}
