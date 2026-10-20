import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import {
  Calendar,
  Tag,
  GitFork,
  Gear,
  FolderPlus,
  FolderSimple,
  FileText,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface VaultDrawerContentProps {
  vaultName: string;
  notesCount: number;
  foldersCount: number;
  folders: string[];
  notes: string[];
  onOpenVaultSwitcher: () => void;
  onSelectNote: (path: string) => void;
  onOpenDailyNote: () => void;
  onOpenTags: () => void;
  onOpenGraph: () => void;
  onOpenSettings: () => void;
  onCreateFolder: () => void;
}

export function VaultDrawerContent({
  vaultName,
  notesCount,
  foldersCount,
  folders,
  notes,
  onOpenVaultSwitcher,
  onSelectNote,
  onOpenDailyNote,
  onOpenTags,
  onOpenGraph,
  onOpenSettings,
  onCreateFolder,
}: VaultDrawerContentProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <View className="flex-1 justify-between">
      {/* Top Header */}
      <Pressable
        onPress={onOpenVaultSwitcher}
        className="px-4 py-3 border-b flex-row items-center justify-between active:bg-bg-hover"
        style={{ borderBottomColor: tokens.color.border.subtle }}
        accessibilityRole="button"
        accessibilityLabel="Switch vault"
      >
        <View>
          <Text variant="h3" color="normal" weight="bold">
            {vaultName} ▾
          </Text>
          <Text variant="caption" color="muted">
            {foldersCount} {foldersCount === 1 ? "folder" : "folders"},{" "}
            {notesCount} {notesCount === 1 ? "note" : "notes"}
          </Text>
        </View>
      </Pressable>

      {/* Main Navigation & Folders */}
      <ScrollView
        className="flex-1 px-3 py-2"
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Links */}
        <View
          className="mb-3 pb-2 border-b"
          style={{ borderBottomColor: tokens.color.border.subtle }}
        >
          <Pressable
            onPress={onOpenDailyNote}
            className="flex-row items-center gap-3 px-3 py-2.5 rounded-lg active:bg-bg-hover min-h-[44px]"
          >
            <Calendar size={18} color={tokens.color.interactive.accent} />
            <Text variant="body" color="normal">
              Daily Note
            </Text>
          </Pressable>
          <Pressable
            onPress={onOpenTags}
            className="flex-row items-center gap-3 px-3 py-2.5 rounded-lg active:bg-bg-hover min-h-[44px]"
          >
            <Tag size={18} color={tokens.color.interactive.accent} />
            <Text variant="body" color="normal">
              Tags
            </Text>
          </Pressable>
          <Pressable
            onPress={onOpenGraph}
            className="flex-row items-center gap-3 px-3 py-2.5 rounded-lg active:bg-bg-hover min-h-[44px]"
          >
            <GitFork size={18} color={tokens.color.interactive.accent} />
            <Text variant="body" color="normal">
              Local Graph
            </Text>
          </Pressable>
        </View>

        {/* Folders & Notes Header */}
        <View className="flex-row items-center justify-between px-3 py-1 mb-1">
          <Text variant="caption" color="muted" weight="semibold">
            FILES & FOLDERS
          </Text>
          <Pressable
            onPress={onCreateFolder}
            className="p-1.5 rounded active:bg-bg-hover"
            accessibilityLabel="New folder"
          >
            <FolderPlus size={16} color={tokens.color.text.muted} />
          </Pressable>
        </View>

        {/* Folders List */}
        {folders.map((folder) => (
          <View
            key={folder}
            className="flex-row items-center gap-2 px-3 py-2 rounded-lg active:bg-bg-hover min-h-[40px]"
          >
            <FolderSimple size={18} color={tokens.color.interactive.accent} />
            <Text
              variant="body"
              color="normal"
              numberOfLines={1}
              className="flex-1"
            >
              {folder}
            </Text>
          </View>
        ))}

        {/* Top-Level Notes */}
        {notes
          .filter((n) => !n.includes("/"))
          .slice(0, 30)
          .map((note) => {
            const stem = note.replace(/\.md$/i, "");
            return (
              <Pressable
                key={note}
                onPress={() => onSelectNote(note)}
                className="flex-row items-center gap-2 px-3 py-2 rounded-lg active:bg-bg-hover min-h-[40px]"
              >
                <FileText size={18} color={tokens.color.text.muted} />
                <Text
                  variant="body"
                  color="normal"
                  numberOfLines={1}
                  className="flex-1"
                >
                  {stem}
                </Text>
              </Pressable>
            );
          })}
      </ScrollView>

      {/* Footer */}
      <View
        className="px-4 py-3 border-t flex-row items-center justify-between"
        style={{ borderTopColor: tokens.color.border.subtle }}
      >
        <Pressable
          onPress={onOpenSettings}
          className="flex-row items-center gap-2.5 py-1.5 active:bg-bg-hover rounded-lg min-h-[44px]"
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Gear size={20} color={tokens.color.text.normal} />
          <Text variant="body" color="normal">
            Settings
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
