import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, FlatList } from "react-native";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  SortAscending,
  SortDescending,
  SidebarSimple,
  FolderPlus,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { IconButton, Text } from "../../components/primitives";
import { ScreenLayout } from "../../components/layout";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { VaultInaccessibleBanner } from "../../components/VaultInaccessibleBanner";
import {
  NavigationDrawer,
  VaultDrawerContent,
  FileActionSheet,
  NewFolderSheet,
} from "../../components/shell";
import {
  defaultVaultManager,
  defaultNoteStore,
  useVaultForegroundSync,
  FirstRunVaultScreen,
  VaultSwitcherSheet,
  VaultItemRow,
  useFilesScreenState,
} from "../../vault";
import {
  moveNoteWithCollisionHandling,
  deleteNoteAndReindex,
} from "../../vault/fileOperations";
import { deriveVisibleItems } from "../../vault/folderViewHelpers";

export default function FilesScreen(): React.ReactElement {
  const router = useRouter();
  const { folder: routeFolder } = useLocalSearchParams<{ folder?: string }>();
  const { tokens } = useTheme();
  const [isSwitcherVisible, setIsSwitcherVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [newFolderVisible, setNewFolderVisible] = useState(false);

  const {
    adapter,
    vaultInfo,
    hasAnyVaults,
    allNotes,
    allFolders,
    currentFolder,
    setCurrentFolder,
    sortMode,
    setSortMode,
    pinnedNotes,
    togglePin,
    actionTargetNote,
    setActionTargetNote,
    isLoadingNotes,
    loadVault,
    handleCreateFolder,
    handleRenameNote,
  } = useFilesScreenState();

  useEffect(() => {
    if (typeof routeFolder === "string") setCurrentFolder(routeFolder);
  }, [routeFolder, setCurrentFolder]);

  const handleOpenNote = (path: string) => {
    const noteId = defaultNoteStore.register(path);
    router.push({
      pathname: "/editor",
      params: { path, noteId, mode: "preview" },
    });
  };

  useFocusEffect(
    useCallback(() => {
      void loadVault();
    }, [loadVault]),
  );

  useVaultForegroundSync({ adapter, onChangesDetected: loadVault });

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
      onTitlePress={() => setIsSwitcherVisible(true)}
      headerLeft={
        <IconButton
          icon={
            <SidebarSimple
              size={20}
              color={tokens.color.interactive.accent}
              weight="regular"
            />
          }
          accessibilityLabel="Open vault navigation"
          size="sm"
          onPress={() => setDrawerVisible(true)}
        />
      }
      headerRight={
        <View className="flex-row items-center gap-1">
          <IconButton
            icon={<FolderPlus size={18} color={tokens.color.text.normal} />}
            accessibilityLabel="New folder"
            size="sm"
            onPress={() => setNewFolderVisible(true)}
          />
          <IconButton
            icon={
              sortMode === "name-asc" ? (
                <SortAscending size={18} color={tokens.color.text.normal} />
              ) : (
                <SortDescending size={18} color={tokens.color.text.normal} />
              )
            }
            accessibilityLabel="Toggle sort"
            size="sm"
            onPress={() =>
              setSortMode(sortMode === "name-asc" ? "name-desc" : "name-asc")
            }
          />
        </View>
      }
    >
      <Breadcrumbs
        currentFolder={currentFolder}
        onNavigate={(folder) => setCurrentFolder(folder)}
      />

      {vaultInfo?.isAccessible === false ? (
        <VaultInaccessibleBanner
          error={vaultInfo.error}
          onRecover={() =>
            defaultVaultManager.recoverToDefaultSandbox().then(loadVault)
          }
          onCreateNewFolder={() =>
            defaultVaultManager.createSandboxVault("My Notes").then(loadVault)
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
              onPressNote={handleOpenNote}
              onLongPressNote={(path) => setActionTargetNote(path)}
            />
          )}
          ListEmptyComponent={
            <View className="p-8 items-center justify-center">
              <Text variant="body" color="muted">
                {isLoadingNotes
                  ? "Loading vault notes..."
                  : 'No notes in this folder. Tap "+" to create one.'}
              </Text>
            </View>
          }
        />
      )}

      <FileActionSheet
        targetPath={actionTargetNote}
        isPinned={actionTargetNote ? pinnedNotes.has(actionTargetNote) : false}
        folders={allFolders}
        visible={actionTargetNote !== null}
        onClose={() => setActionTargetNote(null)}
        onOpen={handleOpenNote}
        onTogglePin={togglePin}
        onRename={handleRenameNote}
        onMove={async (p, dest) => {
          if (adapter) await moveNoteWithCollisionHandling(adapter, p, dest);
          await loadVault();
        }}
        onDelete={async (p) => {
          if (adapter) await deleteNoteAndReindex(adapter, p);
          await loadVault();
        }}
      />

      <NewFolderSheet
        visible={newFolderVisible}
        onClose={() => setNewFolderVisible(false)}
        onCreateFolder={handleCreateFolder}
      />

      <VaultSwitcherSheet
        visible={isSwitcherVisible}
        onClose={() => setIsSwitcherVisible(false)}
        onVaultChanged={loadVault}
      />

      <NavigationDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        <VaultDrawerContent
          vaultName={vaultInfo?.name ?? "Vault"}
          notesCount={allNotes.length}
          foldersCount={allFolders.length}
          folders={allFolders}
          notes={allNotes}
          onOpenVaultSwitcher={() => {
            setDrawerVisible(false);
            setIsSwitcherVisible(true);
          }}
          onSelectNote={(note) => {
            setDrawerVisible(false);
            handleOpenNote(note);
          }}
          onSelectFolder={(folder) => {
            setDrawerVisible(false);
            setCurrentFolder(folder);
          }}
          onOpenDailyNote={() => {
            setDrawerVisible(false);
            router.push("/daily-note-action");
          }}
          onOpenTags={() => {
            setDrawerVisible(false);
            router.push({ pathname: "/(tabs)/search", params: { q: "tag:" } });
          }}
          onOpenGraph={() => {
            setDrawerVisible(false);
            if (allNotes[0]) handleOpenNote(allNotes[0]);
          }}
          onOpenSettings={() => {
            setDrawerVisible(false);
            router.push("/settings");
          }}
          onCreateFolder={() => {
            setDrawerVisible(false);
            setTimeout(() => setNewFolderVisible(true), 250);
          }}
        />
      </NavigationDrawer>
    </ScreenLayout>
  );
}
