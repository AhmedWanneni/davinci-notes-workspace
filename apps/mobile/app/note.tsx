import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  ListBullets,
  Link as LinkIcon,
  PencilSimple,
} from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { Button, IconButton, Sheet, Text } from "../components/primitives";
import { ScreenLayout } from "../components/layout";
import { defaultVaultManager } from "../vault";
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
  const { path: notePath } = useLocalSearchParams<{ path?: string }>();
  const activePath = notePath ?? "Untitled.md";

  const [doc, setDoc] = useState<ParsedMarkdownDocument | null>(null);
  const [allNotes, setAllNotes] = useState<string[]>([]);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [backlinksOpen, setBacklinksOpen] = useState(false);
  const [unresolvedTarget, setUnresolvedTarget] = useState<string | null>(null);
  const [linked, setLinked] = useState<MentionItem[]>([]);
  const [unlinked, setUnlinked] = useState<MentionItem[]>([]);
  const [loadingMentions, setLoadingMentions] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  const loadNote = useCallback(async () => {
    const { adapter } = await defaultVaultManager.getActiveAdapter();
    if (!adapter) return;

    try {
      const scan = await adapter.scanVault();
      setAllNotes(scan.notes);
      const res = await adapter.readNote(activePath);
      setDoc(parseMarkdownDocument(res.content));
    } catch {
      setDoc(
        parseMarkdownDocument(
          `# Note Not Found\n\nCould not open **${activePath}**.`,
        ),
      );
    }
  }, [activePath]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  const handleOpenMentions = async () => {
    setBacklinksOpen(true);
    setLoadingMentions(true);
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
    setLoadingMentions(false);
  };

  const handleWikilinkPress = (target: string, displayText?: string) => {
    const res = resolveWikilink(target, allNotes, displayText);
    if (res.isResolved && res.resolvedPath) {
      router.push({ pathname: "/note", params: { path: res.resolvedPath } });
    } else {
      setUnresolvedTarget(res.targetStem);
    }
  };

  const handleCreateUnresolvedNote = async () => {
    if (!unresolvedTarget) return;
    const { adapter } = await defaultVaultManager.getActiveAdapter();
    if (!adapter) return;

    const newPath = `${unresolvedTarget}.md`;
    await adapter.writeNote(newPath, `# ${unresolvedTarget}\n\n`);
    await defaultVaultIndexer.indexVault(adapter);
    setUnresolvedTarget(null);
    router.push({ pathname: "/note", params: { path: newPath } });
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
            onPress={handleOpenMentions}
          />
          <IconButton
            icon={
              <PencilSimple size={18} color={darkColorTokens.text.accent} />
            }
            accessibilityLabel="Edit note"
            size="sm"
            onPress={() =>
              router.push({ pathname: "/editor", params: { path: activePath } })
            }
          />
        </View>
      }
    >
      {doc ? (
        <NoteReaderView
          document={doc}
          onWikilinkPress={handleWikilinkPress}
          onTagPress={(tag) =>
            router.push({ pathname: "/(tabs)/search", params: { q: tag } })
          }
          onEditPress={() =>
            router.push({ pathname: "/editor", params: { path: activePath } })
          }
          scrollViewRef={scrollRef}
        />
      ) : null}

      {/* Outline Sheet */}
      <OutlineSheet
        visible={outlineOpen}
        onClose={() => setOutlineOpen(false)}
        outline={doc?.outline ?? []}
        onSelectHeading={(_h: OutlineHeading) => {
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }}
      />

      {/* Backlinks Sheet */}
      <BacklinksSheet
        visible={backlinksOpen}
        onClose={() => setBacklinksOpen(false)}
        linked={linked}
        unlinked={unlinked}
        loading={loadingMentions}
        onSelectNote={(note) =>
          router.push({ pathname: "/note", params: { path: note } })
        }
      />

      {/* Unresolved Link Dialog */}
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
          <Button variant="primary" onPress={handleCreateUnresolvedNote}>
            Create Note
          </Button>
        </View>
      </Sheet>
    </ScreenLayout>
  );
}
