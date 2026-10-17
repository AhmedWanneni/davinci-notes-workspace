import React, { useState, useCallback, useRef } from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  ArrowLeft,
  ListBullets,
  Link as LinkIcon,
  PencilSimple,
} from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Button, IconButton, Sheet, Text } from "../components/primitives";
import { ScreenLayout } from "../components/layout";
import { defaultVaultManager, defaultNoteStore, useNotePath } from "../vault";
import { defaultVaultIndexer } from "../indexer";
import { resolveWikilink } from "../vault/wikilinkResolver";
import {
  parseMarkdownDocument,
  NoteReaderView,
  OutlineSheet,
  BacklinksSheet,
  queryNoteMentions,
  type MentionItem,
  type OutlineHeading,
  type ParsedMarkdownDocument,
} from "../reader";

export default function NoteViewScreen(): React.ReactElement {
  const router = useRouter();
  const { path: routePath, noteId } = useLocalSearchParams<{
    path?: string;
    noteId?: string;
  }>();

  const activePath = useNotePath(noteId, routePath ?? "Untitled.md");
  const currentNoteId = noteId ?? defaultNoteStore.register(activePath);

  const [doc, setDoc] = useState<ParsedMarkdownDocument | null>(null);
  const [isMissing, setIsMissing] = useState(false);
  const [allNotes, setAllNotes] = useState<string[]>([]);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [backlinksOpen, setBacklinksOpen] = useState(false);
  const [unresolvedTarget, setUnresolvedTarget] = useState<string | null>(null);
  const [linked, setLinked] = useState<MentionItem[]>([]);
  const [unlinked, setUnlinked] = useState<MentionItem[]>([]);
  const [loadingMentions, setLoadingMentions] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

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

  useFocusEffect(
    useCallback(() => {
      void loadNote();
    }, [loadNote]),
  );

  const handleOpenMentions = async () => {
    setBacklinksOpen(true);
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
  };

  const handleWikilinkPress = (target: string, displayText?: string) => {
    const res = resolveWikilink(target, allNotes, displayText);
    if (res.isResolved && res.resolvedPath) {
      const targetId = defaultNoteStore.register(res.resolvedPath);
      router.push({
        pathname: "/editor",
        params: { path: res.resolvedPath, noteId: targetId, autoFocus: "1" },
      });
    } else {
      setUnresolvedTarget(res.targetStem);
    }
  };

  const handleCreateUnresolvedNote = async () => {
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
  };

  const navigateToEditor = () => {
    router.push({
      pathname: "/editor",
      params: { path: activePath, noteId: currentNoteId, autoFocus: "1" },
    });
  };

  const title = activePath.replace(/\.md$/i, "").split("/").pop() ?? activePath;

  return (
    <ScreenLayout
      title={title}
      headerLeft={
        <IconButton
          icon={<ArrowLeft size={20} color={darkColorTokens.text.normal} />}
          accessibilityLabel="Back"
          size="sm"
          onPress={() => router.back()}
        />
      }
      headerRight={
        <View className="flex-row items-center gap-1">
          <IconButton
            icon={<ListBullets size={18} color={darkColorTokens.text.normal} />}
            accessibilityLabel="Outline"
            size="sm"
            onPress={() => setOutlineOpen(true)}
          />
          <IconButton
            icon={<LinkIcon size={18} color={darkColorTokens.text.normal} />}
            accessibilityLabel="Backlinks"
            size="sm"
            onPress={() => void handleOpenMentions()}
          />
          <IconButton
            icon={
              <PencilSimple size={18} color={darkColorTokens.text.accent} />
            }
            accessibilityLabel="Edit note"
            size="sm"
            onPress={navigateToEditor}
          />
        </View>
      }
    >
      {isMissing ? (
        <View className="flex-1 items-center justify-center p-6 gap-4">
          <Text variant="h2" color="normal">
            Note Not Found
          </Text>
          <Text variant="body" color="muted" className="text-center">
            Could not open "{activePath}". It may have been renamed or deleted.
          </Text>
          <View className="flex-row gap-3 mt-4">
            <Button variant="secondary" onPress={() => router.back()}>
              Back
            </Button>
            <Button variant="primary" onPress={() => router.replace("/(tabs)")}>
              Go to Files
            </Button>
          </View>
        </View>
      ) : doc ? (
        <NoteReaderView
          document={doc}
          onWikilinkPress={handleWikilinkPress}
          onTagPress={(tag) =>
            router.push({ pathname: "/(tabs)/search", params: { q: tag } })
          }
          onEditPress={navigateToEditor}
          scrollViewRef={scrollRef}
        />
      ) : null}

      <OutlineSheet
        visible={outlineOpen}
        onClose={() => setOutlineOpen(false)}
        outline={doc?.outline ?? []}
        onSelectHeading={(_h: OutlineHeading) => {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }}
      />

      <BacklinksSheet
        visible={backlinksOpen}
        onClose={() => setBacklinksOpen(false)}
        linked={linked}
        unlinked={unlinked}
        loading={loadingMentions}
        onSelectNote={(note) => {
          const targetId = defaultNoteStore.register(note);
          router.push({
            pathname: "/note",
            params: { path: note, noteId: targetId },
          });
        }}
      />

      <Sheet
        visible={unresolvedTarget !== null}
        onClose={() => setUnresolvedTarget(null)}
        title="Unresolved Note"
      >
        <Text variant="body" color="normal" className="mb-4">
          The note "{unresolvedTarget}" does not exist yet. Would you like to
          create it?
        </Text>
        <View className="flex-row gap-3 justify-end">
          <Button variant="secondary" onPress={() => setUnresolvedTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={() => void handleCreateUnresolvedNote()}
          >
            Create Note
          </Button>
        </View>
      </Sheet>
    </ScreenLayout>
  );
}
