import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { defaultVaultManager } from "./vaultManager";
import { defaultNoteStore } from "./noteStore";
import { getLastEditedNote } from "./lastEditedNoteStorage";

let hasAutoOpenedInSession = false;

export function useStartupNoteOpener(hasAnyVaults: boolean | null): void {
  const router = useRouter();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current || hasAutoOpenedInSession || hasAnyVaults === false) {
      return;
    }
    ranRef.current = true;
    hasAutoOpenedInSession = true;

    async function autoOpen() {
      try {
        const { adapter } = await defaultVaultManager.getActiveAdapter();
        if (!adapter) return;

        const lastNote = await getLastEditedNote();
        if (lastNote) {
          const stat = await adapter.statFile(lastNote);
          if (stat.exists) {
            const noteId = defaultNoteStore.register(lastNote);
            router.replace({
              pathname: "/editor",
              params: { path: lastNote, noteId, mode: "edit" },
            });
            return;
          }
        }

        // Default: Open new unsaved note
        router.replace({
          pathname: "/editor",
          params: { preset: "new", mode: "edit" },
        });
      } catch (err) {
        console.warn("[startupOpener] Failed to auto-open note:", err);
      }
    }

    void autoOpen();
  }, [hasAnyVaults, router]);
}
