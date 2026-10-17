import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, FlatList } from "react-native";
import { useRouter } from "expo-router";
import {
  SortAscending,
  SortDescending,
  SlidersHorizontal,
  Folders,
} from "phosphor-react-native";
import { darkColorTokens } from "@app/design-tokens/mobile";
import { IconButton, Text } from "../../components/primitives";
import { ScreenLayout } from "../../components/layout";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FolderActionSheet } from "../../components/FolderActionSheet";
import { VaultInaccessibleBanner } from "../../components/VaultInaccessibleBanner";
import {
  defaultVaultManager,
  useVaultForegroundSync,
  FirstRunVaultScreen,
  VaultSwitcherSheet,
  VaultItemRow,
  type MobileVaultStorageAdapter,
  type VaultInfo,
} from "../../vault";
import { defaultVaultIndexer } from "../../indexer";
import {
  moveNoteWithCollisionHandling,
  deleteNoteAndReindex,
} from "../../vault/fileOperations";
import {
  deriveVisibleItems,
  type SortMode,
} from "../../vault/folderViewHelpers";

export default function FilesScreen(): React.ReactElement {
  const router = useRouter();
  const [adapter, setAdapter] = useState<MobileVaultStorageAdapter | null>(
    null,
  );
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [hasAnyVaults, setHasAnyVaults] = useState<boolean | null>(null);
  const [isSwitcherVisible, setIsSwitcherVisible] = useState(false);
  const [allNotes, setAllNotes] = useState<string[]>([]);
  const [allFolders, setAllFolders] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>("");
  const [sortMode, setSortMode] = useState<SortMode>("name-asc");
  const [pinnedNotes, setPinnedNotes] = useState<Set<string>>(new Set());
  const [actionTargetNote, setActionTargetNote] = useState<string | null>(null);

  const loadVault = useCallback(async () => {
    const {
      adapter: active,
      info,
      hasAnyVaults: exists,
    } = await defaultVaultManager.getActiveAdapter();
    setHasAnyVaults(exists);
    setVaultInfo(info);
    setAdapter(active);

    if (active) {
      try {
        const scan = await active.scanVault();
        setAllNotes(scan.notes);
        setAllFolders(scan.folders);
        defaultVaultIndexer.indexVault(active).catch(() => {});
      } catch (err) {
        setVaultInfo({
          ...info,
          isAccessible: false,
          error: err instanceof Error ? err.message : "Failed to scan vault",
        });
      }
    }
  }, []);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  useVaultForegroundSync({
    adapter,
    onChangesDetected: () => {
      loadVault();
    },
  });

  const togglePin = (path: string) => {
    setPinnedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const { listData } = useMemo(
    () =>
      deriveVisibleItems(
        allFolders,
        allNotes,
        currentFolder,
        sortMode,
        pinnedNotes,
      ),
    [allFolders, allNotes, currentFolder, sortMode, pinnedNotes],
  );

  if (hasAnyVaults === false) {
    return <FirstRunVaultScreen onVaultReady={loadVault} />;
  }

  return (
    <ScreenLayout
      title={vaultInfo?.name ?? "Files"}
      headerLeft={
        <IconButton
          icon={<Folders size={18} color={darkColorTokens.text.normal} />}
          accessibilityLabel="Switch vault"
          size="sm"
          onPress={() => setIsSwitcherVisible(true)}
        />
      }
      headerRight={
        <View className="flex-row items-center gap-1">
          <IconButton
            icon={
              sortMode === "name-asc" ? (
                <SortAscending size={18} color={darkColorTokens.text.normal} />
              ) : (
                <SortDescending size={18} color={darkColorTokens.text.normal} />
              )
            }
            accessibilityLabel="Toggle sort"
            size="sm"
            onPress={() =>
              setSortMode(sortMode === "name-asc" ? "name-desc" : "name-asc")
            }
          />
          {__DEV__ && (
            <IconButton
              icon={
                <SlidersHorizontal
                  size={18}
                  color={darkColorTokens.text.normal}
                />
              }
              accessibilityLabel="Component Gallery"
              size="sm"
              onPress={() => router.push("/gallery")}
            />
          )}
        </View>
      }
    >
      <Breadcrumbs
        currentFolder={currentFolder}
        onNavigate={(folder) => setCurrentFolder(folder)}
      />

      {vaultInfo && !vaultInfo.isAccessible ? (
        <VaultInaccessibleBanner
          error={vaultInfo.error}
          onRecover={() =>
            defaultVaultManager.recoverToDefaultSandbox().then(loadVault)
          }
        />
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => `${item.type}:${item.path}`}
          showsVerticalScrollIndicator={false}
          initialNumToRender={25}
          maxToRenderPerBatch={25}
          windowSize={11}
          removeClippedSubviews
          renderItem={({ item }) => (
            <VaultItemRow
              item={item}
              isPinned={pinnedNotes.has(item.path)}
              onPressFolder={(folder) => setCurrentFolder(folder)}
              onPressNote={(path) =>
                router.push({ pathname: "/note", params: { path } })
              }
              onLongPressNote={(path) => setActionTargetNote(path)}
            />
          )}
          ListEmptyComponent={
            <View className="p-8 items-center justify-center">
              <Text variant="body" color="muted">
                No notes in this folder. Tap &quot;+&quot; to create one.
              </Text>
            </View>
          }
        />
      )}

      <FolderActionSheet
        targetNote={actionTargetNote}
        isPinned={actionTargetNote ? pinnedNotes.has(actionTargetNote) : false}
        folders={allFolders}
        visible={actionTargetNote !== null}
        onClose={() => setActionTargetNote(null)}
        onOpen={(path) => router.push({ pathname: "/note", params: { path } })}
        onTogglePin={togglePin}
        onMove={async (p, dest) => {
          if (adapter) await moveNoteWithCollisionHandling(adapter, p, dest);
          await loadVault();
        }}
        onDelete={async (p) => {
          if (adapter) await deleteNoteAndReindex(adapter, p);
          await loadVault();
        }}
      />

      <VaultSwitcherSheet
        visible={isSwitcherVisible}
        onClose={() => setIsSwitcherVisible(false)}
        onVaultChanged={loadVault}
      />
    </ScreenLayout>
  );
}
