import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { defaultVaultManager, defaultNoteStore } from "../vault";
import { defaultVaultIndexer } from "../indexer";
import { resolveWikilink } from "../vault/wikilinkResolver";
import { parseMarkdownDocument } from "./markdownParser";
import { queryNoteMentions, type MentionItem } from "./backlinksQuery";
import type { ParsedMarkdownDocument } from "./markdownAst";

export function useNoteReaderState(activePath: string, currentNoteId: string) {
  const router = useRouter();
  const [doc, setDoc] = useState<ParsedMarkdownDocument | null>(null);
  const [isMissing, setIsMissing] = useState(false);
  const [allNotes, setAllNotes] = useState<string[]>([]);
  const [linked, setLinked] = useState<MentionItem[]>([]);
  const [unlinked, setUnlinked] = useState<MentionItem[]>([]);
  const [loadingMentions, setLoadingMentions] = useState(false);
  const [unresolvedTarget, setUnresolvedTarget] = useState<string | null>(null);

  const loadNote = useCallback(async () => {
    try {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) return;
      const scan = await adapter.scanVault();
      setAllNotes(scan.notes);
      const res = await adapter.readNote(activePath);
      setDoc(parseMarkdownDocument(res.content));
      setIsMissing(false);
    } catch {
      setDoc(null);
      setIsMissing(true);
    }
  }, [activePath]);

  const loadMentions = useCallback(async () => {
    setLoadingMentions(true);
    try {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) return;
      const res = await queryNoteMentions(activePath, async (p) => {
        try {
          const n = await adapter.readNote(p);
          return n.content;
        } catch {
          return null;
        }
      });
      setLinked(res.linked);
      setUnlinked(res.unlinked);
    } catch (err) {
      console.warn("[note] Mentions query failed:", err);
    } finally {
      setLoadingMentions(false);
    }
  }, [activePath]);

  const handleWikilinkPress = useCallback(
    (target: string, displayText?: string) => {
      const res = resolveWikilink(target, allNotes, displayText);
      if (res.isResolved && res.resolvedPath) {
        const targetId = defaultNoteStore.register(res.resolvedPath);
        router.push({
          pathname: "/editor",
          params: { path: res.resolvedPath, noteId: targetId, mode: "preview" },
        });
      } else {
        setUnresolvedTarget(res.targetStem);
      }
    },
    [allNotes, router],
  );

  const handleCreateUnresolvedNote = useCallback(async () => {
    if (!unresolvedTarget) return;
    try {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) return;
      const newPath = `${unresolvedTarget}.md`;
      await adapter.writeNote(newPath, `# ${unresolvedTarget}\n\n`);
      await defaultVaultIndexer.indexVault(adapter);
      setUnresolvedTarget(null);
      const targetId = defaultNoteStore.register(newPath);
      router.push({
        pathname: "/editor",
        params: { path: newPath, noteId: targetId, autoFocus: "1" },
      });
    } catch (err) {
      console.error("[note] Failed to create unresolved note:", err);
    }
  }, [unresolvedTarget, router]);

  const navigateToEditor = useCallback(() => {
    router.push({
      pathname: "/editor",
      params: { path: activePath, noteId: currentNoteId, autoFocus: "1" },
    });
  }, [activePath, currentNoteId, router]);

  return {
    doc,
    isMissing,
    linked,
    unlinked,
    loadingMentions,
    unresolvedTarget,
    setUnresolvedTarget,
    loadNote,
    loadMentions,
    handleWikilinkPress,
    handleCreateUnresolvedNote,
    navigateToEditor,
  };
}
