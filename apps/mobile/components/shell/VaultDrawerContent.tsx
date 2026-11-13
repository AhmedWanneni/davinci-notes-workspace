import React, { useState, useMemo } from "react";
import { View, Pressable } from "react-native";
import {
  SidebarSimple,
  Calendar,
  Tag,
  GitFork,
  FolderPlus,
  FilePlus,
  SquaresFour,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [emojiPickerFolder, setEmojiPickerFolder] = useState<string | null>(
    null,
  );

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const gridNotes = useMemo(
    () =>
      notes.map((path) => ({
        id: path,
        path,
        title: path.split("/").pop()?.replace(/\.md$/i, "") ?? path,
        dateStr: "Recent",
      })),
    [notes],
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.color.bg.primary,
        justifyContent: "space-between",
      }}
    >
      {/* Top Header */}
      <View
        className="h-[48px] flex-row items-center justify-between px-4 mb-2"
        style={{ backgroundColor: tokens.color.bg.primary }}
      >
        <View className="flex-row items-center gap-0.5">
          <Pressable
            onPress={onOpenDailyNote}
            accessibilityRole="button"
            accessibilityLabel="Daily note"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <Calendar
              size={20}
              color={tokens.color.text.normal}
              weight="regular"
            />
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
            <GitFork
              size={20}
              color={tokens.color.text.normal}
              weight="regular"
            />
          </Pressable>

          <Pressable
            onPress={onCreateFolder}
            accessibilityRole="button"
            accessibilityLabel="Add folder"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <FolderPlus
              size={20}
              color={tokens.color.text.normal}
              weight="regular"
            />
          </Pressable>

          <Pressable
            onPress={onCreateNote}
            accessibilityRole="button"
            accessibilityLabel="Add file to vault"
            className="w-9 h-9 items-center justify-center rounded-lg active:bg-bg-hover"
          >
            <FilePlus
              size={20}
              color={tokens.color.text.normal}
              weight="regular"
            />
          </Pressable>
        </View>

        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close sidebar navigation"
          className="w-9 h-9 rounded-lg items-center justify-center active:bg-bg-hover"
        >
          <SidebarSimple
            size={20}
            color={tokens.color.text.normal}
            weight="regular"
          />
        </Pressable>
      </View>

      {/* Quick Navigation: Calendar & Cards Grid View */}
      <View
        className="flex-row items-center justify-between px-3 pb-2 border-b mb-1 gap-2"
        style={{ borderBottomColor: tokens.color.border.subtle }}
      >
        <Pressable
          onPress={onOpenCalendar}
          accessibilityRole="button"
          accessibilityLabel="Open Calendar and Reminders"
          className="flex-1 flex-row items-center justify-center gap-1.5 py-1.5 rounded-lg active:opacity-75"
          style={{ backgroundColor: tokens.color.bg.secondary }}
        >
          <Calendar
            size={16}
            color={tokens.color.interactive.accent}
            weight="bold"
          />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: tokens.color.text.normal,
            }}
          >
            Calendar
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setViewMode((m) => (m === "grid" ? "tree" : "grid"))}
          accessibilityRole="button"
          accessibilityLabel="Toggle 2-column card grid view"
          className="flex-1 flex-row items-center justify-center gap-1.5 py-1.5 rounded-lg active:opacity-75"
          style={{
            backgroundColor:
              viewMode === "grid"
                ? tokens.color.interactive.accent
                : tokens.color.bg.secondary,
          }}
        >
          <SquaresFour
            size={16}
            color={
              viewMode === "grid"
                ? tokens.color.text["on-accent"]
                : tokens.color.text.normal
            }
            weight="bold"
          />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color:
                viewMode === "grid"
                  ? tokens.color.text["on-accent"]
                  : tokens.color.text.normal,
            }}
          >
            Grid Cards
          </Text>
        </Pressable>
      </View>

      {/* Main Content: Folder Grid Cards or Tree List */}
      {viewMode === "grid" ? (
        <FolderGridView
          notes={gridNotes}
          folderName="Все файлы"
          onOpenNote={(path) => {
            onClose?.();
            onSelectNote(path);
          }}
          onDeleteNote={onDeleteNote}
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
