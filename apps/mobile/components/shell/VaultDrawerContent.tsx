import React, { useState } from "react";
import { View, ScrollView, Pressable, Alert } from "react-native";
import {
  SidebarSimple,
  Calendar,
  Tag,
  GitFork,
  FolderPlus,
  FilePlus,
  FileText,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import { DrawerFolderItem } from "./DrawerFolderItem";

export interface VaultDrawerContentProps {
  vaultName?: string;
  notesCount?: number;
  foldersCount?: number;
  folders: string[];
  notes: string[];
  onClose?: () => void;
  onOpenVaultSwitcher?: () => void;
  onSelectNote: (path: string) => void;
  onSelectFolder?: (folder: string) => void;
  onOpenDailyNote: () => void;
  onOpenTags: () => void;
  onOpenGraph: () => void;
  onOpenSettings?: () => void;
  onCreateFolder: () => void;
  onCreateNote?: () => void;
  onDeleteFolder?: (folder: string) => void;
  onDeleteNote?: (path: string) => void;
}

export function VaultDrawerContent({
  folders,
  notes,
  onClose,
  onSelectNote,
  onSelectFolder,
  onOpenDailyNote,
  onOpenTags,
  onOpenGraph,
  onCreateFolder,
  onCreateNote,
  onDeleteFolder,
  onDeleteNote,
}: VaultDrawerContentProps): React.ReactElement {
  const { tokens } = useTheme();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const isFolderVisible = (folder: string): boolean => {
    const parts = folder.split("/");
    if (parts.length === 1) return true;
    let current = "";
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? `${current}/${parts[i]}` : parts[i];
      if (!expandedFolders.has(current)) return false;
    }
    return true;
  };

  const topLevelNotes = notes.filter((n) => !n.includes("/"));

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.bg.primary, justifyContent: "space-between" }}>
      {/* Top Header: Icons on the left, Close button on the right, no bottom border */}
      <View
        className="h-[48px] flex-row items-center justify-between px-4 mb-3"
        style={{
          backgroundColor: tokens.color.bg.primary,
          marginTop: 0,
        }}
      >
        {/* Left: 5 action icons in exact order: daily note, tags, local graph, add folder, add file */}
        <View className="flex-row items-center gap-0.5">
          {/* 1. Daily note */}
          <Pressable
            onPress={onOpenDailyNote}
            accessibilityRole="button"
            accessibilityLabel="Daily note"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <Calendar size={20} color="#000000" weight="regular" />
          </Pressable>

          {/* 2. Tags */}
          <Pressable
            onPress={onOpenTags}
            accessibilityRole="button"
            accessibilityLabel="Tags"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <Tag size={20} color="#000000" weight="regular" />
          </Pressable>

          {/* 3. Local graph */}
          <Pressable
            onPress={onOpenGraph}
            accessibilityRole="button"
            accessibilityLabel="Local graph"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <GitFork size={20} color="#000000" weight="regular" />
          </Pressable>

          {/* 4. Add folder */}
          <Pressable
            onPress={onCreateFolder}
            accessibilityRole="button"
            accessibilityLabel="Add folder"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <FolderPlus size={20} color="#000000" weight="regular" />
          </Pressable>

          {/* 5. Add file to vault */}
          <Pressable
            onPress={onCreateNote}
            accessibilityRole="button"
            accessibilityLabel="Add file to vault"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <FilePlus size={20} color="#000000" weight="regular" />
          </Pressable>
        </View>

        {/* Right: Close button */}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close sidebar navigation"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tokens.color.bg.primary,
          }}
        >
          <SidebarSimple size={20} color="#000000" weight="regular" />
        </Pressable>
      </View>

      {/* Main Folders & Notes List (no title lines or quick links) */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 12, paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {folders.slice().sort().filter(isFolderVisible).map((folder) => {
          const depth = folder.split("/").length - 1;
          const displayName = folder.split("/").pop() ?? folder;
          const folderNotes = notes.filter((n) => {
            if (!n.startsWith(`${folder}/`)) return false;
            const remaining = n.slice(folder.length + 1);
            return !remaining.includes("/");
          });

          return (
            <DrawerFolderItem
              key={folder}
              folder={folder}
              displayName={displayName}
              depth={depth}
              isExpanded={expandedFolders.has(folder)}
              notes={folderNotes}
              onToggleExpand={() => toggleFolder(folder)}
              onSelectFolder={onSelectFolder}
              onSelectNote={onSelectNote}
              onDeleteFolder={onDeleteFolder}
              onDeleteNote={onDeleteNote}
            />
          );
        })}

        {topLevelNotes.map((note) => {
          const stem = note.replace(/\.md$/i, "");
          return (
            <Pressable
              key={note}
              onPress={() => onSelectNote(note)}
              onLongPress={() => {
                Alert.alert("Delete Note", `Delete "${stem}"?`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => onDeleteNote?.(note) },
                ]);
              }}
              className="flex-row items-center gap-2 px-3 py-2 rounded-lg active:bg-bg-hover min-h-[40px]"
            >
              <FileText size={18} color={tokens.color.text.muted} />
              <Text variant="body" color="normal" numberOfLines={1} className="flex-1" style={{ fontSize: 16 }}>
                {stem}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
