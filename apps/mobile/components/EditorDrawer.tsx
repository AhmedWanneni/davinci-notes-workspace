import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { NavigationDrawer } from "./shell/NavigationDrawer";
import { VaultDrawerContent } from "./shell/VaultDrawerContent";
import { NewFolderSheet } from "./shell/NewFolderSheet";
import { defaultVaultManager } from "../vault/vaultManager";
import { defaultVaultIndexer } from "../indexer";

export interface EditorDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelectNote: (path: string) => void;
  onCreateNote?: () => void;
}

export function EditorDrawer({
  visible,
  onClose,
  onSelectNote,
  onCreateNote: onCreateNoteProp,
}: EditorDrawerProps): React.ReactElement {
  const router = useRouter();
  const [notes, setNotes] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [newFolderVisible, setNewFolderVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    async function loadList() {
      try {
        const { adapter } = await defaultVaultManager.getActiveAdapter();
        if (!adapter) return;
        const [nList, fList] = await Promise.all([
          adapter.listNotes(),
          adapter.listFolders(),
        ]);
        setNotes(nList);
        setFolders(fList);
      } catch (err) {
        console.warn("[EditorDrawer] Load error:", err);
      }
    }
    void loadList();
  }, [visible]);

  const handleCreateFolder = async (folderName: string) => {
    try {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (adapter) {
        await adapter.createFolder(folderName);
        const [nList, fList] = await Promise.all([
          adapter.listNotes(),
          adapter.listFolders(),
        ]);
        setNotes(nList);
        setFolders(fList);
      }
    } catch (err) {
      console.warn("[EditorDrawer] Create folder error:", err);
    } finally {
      setNewFolderVisible(false);
    }
  };

  const handleDeleteNote = async (notePath: string) => {
    try {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (adapter) {
        await adapter.deleteNote(notePath);
        void defaultVaultIndexer.indexVault(adapter, false);
        const [nList, fList] = await Promise.all([
          adapter.listNotes(),
          adapter.listFolders(),
        ]);
        setNotes(nList);
        setFolders(fList);
      }
    } catch (err) {
      console.warn("[EditorDrawer] Delete note error:", err);
    }
  };

  const handleDeleteFolder = async (folderPath: string) => {
    try {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (adapter) {
        await adapter.deleteNote(folderPath);
        void defaultVaultIndexer.indexVault(adapter, false);
        const [nList, fList] = await Promise.all([
          adapter.listNotes(),
          adapter.listFolders(),
        ]);
        setNotes(nList);
        setFolders(fList);
      }
    } catch (err) {
      console.warn("[EditorDrawer] Delete folder error:", err);
    }
  };

  return (
    <>
      <NavigationDrawer visible={visible} onClose={onClose}>
        <VaultDrawerContent
          folders={folders}
          notes={notes}
          onClose={onClose}
          onSelectNote={(note) => {
            onClose();
            onSelectNote(note);
          }}
          onDeleteNote={handleDeleteNote}
          onDeleteFolder={handleDeleteFolder}
          onOpenDailyNote={() => {
            onClose();
            router.push("/daily-note-action");
          }}
          onOpenTags={() => {
            onClose();
            router.push({ pathname: "/search", params: { q: "tag:" } });
          }}
          onOpenGraph={() => {
            onClose();
            if (notes[0]) onSelectNote(notes[0]);
          }}
          onOpenSettings={() => {
            onClose();
            router.push("/settings");
          }}
          onCreateFolder={() => setNewFolderVisible(true)}
          onCreateNote={() => {
            onClose();
            if (onCreateNoteProp) onCreateNoteProp();
            else router.push({ pathname: "/editor", params: { preset: "new", autoFocus: "1" } });
          }}
        />
      </NavigationDrawer>

      <NewFolderSheet
        visible={newFolderVisible}
        onClose={() => setNewFolderVisible(false)}
        onCreateFolder={handleCreateFolder}
      />
    </>
  );
}
