import React, { useState } from "react";
import { View, Pressable } from "react-native";
import {
  SidebarSimple,
  Calendar,
  Tag,
  GitFork,
  FolderPlus,
  FilePlus,
  SquaresFour,
  List as ListIcon,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { DrawerFolderList } from "./DrawerFolderList";
import { FolderEmojiPickerModal } from "./FolderEmojiPickerModal";
import { FolderGridView } from "../cards/FolderGridView";
import { useTreeIcons } from "../../vault/useTreeIcons";

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
  onOpenCalendar?: () => void;
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
  onOpenCalendar,
  onOpenTags,
  onOpenGraph,
  onCreateFolder,
  onCreateNote,
  onDeleteFolder,
  onDeleteNote,
}: VaultDrawerContentProps): React.ReactElement {
  const { tokens } = useTheme();
  const { icons, setIcon } = useTreeIcons();
  const [viewMode, setViewMode] = useState<"tree" | "grid">("tree");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [emojiPickerFolder, setEmojiPickerFolder] = useState<string | null>(null);

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.bg.primary, justifyContent: "space-between" }}>
      {/* Top Header: Simple icons only, no tabs */}
      <View
        className="h-[48px] flex-row items-center justify-between px-4 mb-2"
        style={{ backgroundColor: tokens.color.bg.primary }}
      >
        <View className="flex-row items-center gap-0.5">
          <Pressable
            onPress={onOpenCalendar ?? onOpenDailyNote}
            accessibilityRole="button"
            accessibilityLabel="Calendar view"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <Calendar size={20} color={tokens.color.text.normal} weight="regular" />
          </Pressable>

          <Pressable
            onPress={onOpenTags}
            accessibilityRole="button"
            accessibilityLabel="Tags"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <Tag size={20} color={tokens.color.text.normal} weight="regular" />
          </Pressable>

          <Pressable
            onPress={onOpenGraph}
            accessibilityRole="button"
            accessibilityLabel="Local graph"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <GitFork size={20} color={tokens.color.text.normal} weight="regular" />
          </Pressable>

          <Pressable
            onPress={onCreateFolder}
            accessibilityRole="button"
            accessibilityLabel="Add folder"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <FolderPlus size={20} color={tokens.color.text.normal} weight="regular" />
          </Pressable>

          <Pressable
            onPress={onCreateNote}
            accessibilityRole="button"
            accessibilityLabel="Add file to vault"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <FilePlus size={20} color={tokens.color.text.normal} weight="regular" />
          </Pressable>
        </View>

        {/* Right: Grid & List/Tree simple icon toggles + Close */}
        <View className="flex-row items-center gap-0.5">
          <Pressable
            onPress={() => setViewMode("tree")}
            accessibilityRole="button"
            accessibilityLabel="Tree view"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
            style={{
              backgroundColor: viewMode === "tree" ? tokens.color.bg.secondary : "transparent",
            }}
          >
            <ListIcon
              size={20}
              color={viewMode === "tree" ? tokens.color.interactive.accent : tokens.color.text.muted}
              weight={viewMode === "tree" ? "bold" : "regular"}
            />
          </Pressable>

          <Pressable
            onPress={() => setViewMode("grid")}
            accessibilityRole="button"
            accessibilityLabel="Grid view"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
            style={{
              backgroundColor: viewMode === "grid" ? tokens.color.bg.secondary : "transparent",
            }}
          >
            <SquaresFour
              size={20}
              color={viewMode === "grid" ? tokens.color.interactive.accent : tokens.color.text.muted}
              weight={viewMode === "grid" ? "fill" : "regular"}
            />
          </Pressable>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close sidebar navigation"
            className="w-9 h-9 rounded-lg items-center justify-center active:bg-bg-hover"
          >
            <SidebarSimple size={20} color={tokens.color.text.normal} weight="regular" />
          </Pressable>
        </View>
      </View>

      {/* Main Content: 2-Column Grid (files and folders only) or Tree List */}
      {viewMode === "grid" ? (
        <FolderGridView
          folders={folders}
          notes={notes}
          icons={icons}
          onOpenNote={(path) => {
            onClose?.();
            onSelectNote(path);
          }}
          onDeleteNote={onDeleteNote}
          onDeleteFolder={onDeleteFolder}
        />
      ) : (
        <DrawerFolderList
          folders={folders}
          notes={notes}
          expandedFolders={expandedFolders}
          icons={icons}
          onToggleFolder={toggleFolder}
          onSelectFolder={onSelectFolder}
          onSelectNote={onSelectNote}
          onDeleteFolder={onDeleteFolder}
          onDeleteNote={onDeleteNote}
          onPressIcon={(f) => setEmojiPickerFolder(f)}
        />
      )}

      {/* Emoji Picker Modal */}
      {emojiPickerFolder ? (
        <FolderEmojiPickerModal
          visible={Boolean(emojiPickerFolder)}
          folderName={emojiPickerFolder}
          currentEmoji={icons[emojiPickerFolder]}
          onClose={() => setEmojiPickerFolder(null)}
          onSelectEmoji={(emoji) => {
            if (emojiPickerFolder) void setIcon(emojiPickerFolder, emoji);
          }}
        />
      ) : null}
    </View>
  );
}
