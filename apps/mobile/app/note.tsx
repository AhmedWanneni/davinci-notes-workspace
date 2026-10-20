import React, { useState, useCallback, useRef } from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { Button, Sheet, Text } from "../components/primitives";
import {
  MobileHeader,
  QuickActionBar,
  NoteActionSheet,
  NavigationDrawer,
  VaultDrawerContent,
} from "../components/shell";
import {
  defaultNoteStore,
  useNotePath,
  defaultVaultManager,
  type MobileVaultStorageAdapter,
} from "../vault";
import {
  NoteReaderView,
  OutlineSheet,
  BacklinksSheet,
  useNoteReaderState,
  type OutlineHeading,
} from "../reader";
import { LocalGraphView } from "../graph";
import { CanvasViewer } from "../canvas";
import { useImmersiveNavigationBar, useImmersiveMode } from "../settings";
import { NavigationBar } from "expo-navigation-bar";
import { Platform } from "react-native";

export default function NoteViewScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tokens } = useTheme();
  const { isImmersiveMode } = useImmersiveMode();
  useImmersiveNavigationBar();
  const { path: routePath, noteId } = useLocalSearchParams<{
    path?: string;
    noteId?: string;
  }>();

  const activePath = useNotePath(noteId, routePath ?? "Untitled.md");
  const currentNoteId = noteId ?? defaultNoteStore.register(activePath);

  const {
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
  } = useNoteReaderState(activePath, currentNoteId);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [backlinksOpen, setBacklinksOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [adapter, setAdapter] = useState<MobileVaultStorageAdapter | null>(
    null,
  );
  const [vaultName, setVaultName] = useState("Vault");
  const [vaultNotes, setVaultNotes] = useState<string[]>([]);
  const [vaultFolders, setVaultFolders] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadNote();
      defaultVaultManager.getActiveAdapter().then(({ adapter: a, info }) => {
        setAdapter(a);
        if (info?.name) setVaultName(info.name);
        if (a)
          a.scanVault()
            .then((s) => {
              setVaultNotes(s.notes);
              setVaultFolders(s.folders);
            })
            .catch(() => {});
      });
    }, [loadNote]),
  );

  const pathParts = activePath.replace(/\.md$/i, "").split("/");
  const title = pathParts.pop() ?? activePath;
  const folder = pathParts.length > 0 ? pathParts.join("/") : undefined;
  const isCanvas = activePath.endsWith(".canvas");

  return (
    <View
      className="flex-1"
      style={{
        flex: 1,
        backgroundColor: tokens.color.bg.primary,
        paddingTop: insets.top,
      }}
    >
      {Platform.OS === "android" && isImmersiveMode ? (
        <NavigationBar hidden={true} />
      ) : null}
      <MobileHeader
        title={title}
        folder={folder}
        isReadingView={true}
        onToggleSidebar={() => setDrawerOpen(true)}
        onToggleReadingView={navigateToEditor}
        onOpenMoreMenu={() => setSheetOpen(true)}
      />

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
      ) : isCanvas && adapter ? (
        <CanvasViewer canvasPath={activePath} adapter={adapter} />
      ) : doc ? (
        <View className="flex-1">
          <NoteReaderView
            document={doc}
            title={title}
            onWikilinkPress={handleWikilinkPress}
            onTagPress={(tag) =>
              router.push({ pathname: "/(tabs)/search", params: { q: tag } })
            }
            onEditPress={navigateToEditor}
            scrollViewRef={scrollRef}
          />
        </View>
      ) : null}

      <QuickActionBar
        canGoBack={true}
        onBack={() => router.back()}
        onForward={() => {}}
        onNewNote={() =>
          router.push({
            pathname: "/editor",
            params: { preset: "new", autoFocus: "1" },
          })
        }
        onOpenTabs={() => router.push("/(tabs)")}
        tabCount={1}
        onOpenMore={() => setSheetOpen(true)}
      />

      <NavigationDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <VaultDrawerContent
          vaultName={vaultName}
          notesCount={vaultNotes.length}
          foldersCount={vaultFolders.length}
          folders={vaultFolders}
          notes={vaultNotes}
          onOpenVaultSwitcher={() => {
            setDrawerOpen(false);
            router.push("/(tabs)");
          }}
          onSelectNote={(n) => {
            setDrawerOpen(false);
            const targetId = defaultNoteStore.register(n);
            router.push({
              pathname: "/note",
              params: { path: n, noteId: targetId },
            });
          }}
          onOpenDailyNote={() => {
            setDrawerOpen(false);
            router.push("/daily-note-action");
          }}
          onOpenTags={() => {
            setDrawerOpen(false);
            router.push({ pathname: "/(tabs)/search", params: { q: "tag:" } });
          }}
          onOpenGraph={() => {
            setDrawerOpen(false);
            setGraphOpen(true);
          }}
          onOpenSettings={() => {
            setDrawerOpen(false);
            router.push("/settings");
          }}
          onCreateFolder={() => {
            setDrawerOpen(false);
            router.push("/(tabs)");
          }}
        />
      </NavigationDrawer>

      <NoteActionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        isReadingView={true}
        onToggleReadingView={() => {
          setSheetOpen(false);
          navigateToEditor();
        }}
        onToggleSourceMode={() => {
          setSheetOpen(false);
          navigateToEditor();
        }}
        onOpenOutline={() => {
          setSheetOpen(false);
          setOutlineOpen(true);
        }}
        onOpenBacklinks={() => {
          setSheetOpen(false);
          void loadMentions();
          setBacklinksOpen(true);
        }}
        onOpenGraph={() => {
          setSheetOpen(false);
          setGraphOpen(true);
        }}
        onRename={() => {
          setSheetOpen(false);
          navigateToEditor();
        }}
      />

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
        visible={graphOpen}
        onClose={() => setGraphOpen(false)}
        title="Local Graph"
      >
        <LocalGraphView
          notePath={activePath}
          onNavigate={(targetPath) => {
            setGraphOpen(false);
            const targetId = defaultNoteStore.register(targetPath);
            router.push({
              pathname: "/note",
              params: { path: targetPath, noteId: targetId },
            });
          }}
        />
      </Sheet>

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
    </View>
  );
}
