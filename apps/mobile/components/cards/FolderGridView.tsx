import React, { useState, useMemo } from "react";
import { View, FlatList, Pressable } from "react-native";
import { ArrowLeft } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import { NoteCardGridItem } from "./NoteCardGridItem";
import { FolderCardGridItem } from "./FolderCardGridItem";

export interface FolderGridViewProps {
  folders: string[];
  notes: string[];
  icons?: Record<string, string>;
  onOpenNote: (path: string) => void;
  onDeleteNote?: (path: string) => void;
  onDeleteFolder?: (folder: string) => void;
}

type GridEntry =
  | { type: "folder"; name: string; path: string; icon?: string; count: number }
  | { type: "file"; name: string; path: string };

export function FolderGridView({
  folders,
  notes,
  icons = {},
  onOpenNote,
  onDeleteNote,
  onDeleteFolder,
}: FolderGridViewProps): React.ReactElement {
  const { tokens } = useTheme();
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  // Compute entries: files and folders only, not sub folders or sub files
  const displayItems = useMemo<GridEntry[]>(() => {
    if (!activeFolder) {
      // Top level only: no slash in folder name, no slash in note name
      const topFolders: GridEntry[] = folders
        .filter((f) => !f.includes("/"))
        .sort()
        .map((f) => ({
          type: "folder",
          name: f,
          path: f,
          icon: icons[f],
          count: notes.filter((n) => n.startsWith(`${f}/`)).length,
        }));

      const topFiles: GridEntry[] = notes
        .filter((n) => !n.includes("/"))
        .sort()
        .map((n) => ({
          type: "file",
          name: n.replace(/\.md$/i, ""),
          path: n,
        }));

      return [...topFolders, ...topFiles];
    }

    // Inside activeFolder: direct files only (no nested sub files)
    const prefix = `${activeFolder}/`;
    return notes
      .filter((n) => n.startsWith(prefix) && !n.slice(prefix.length).includes("/"))
      .sort()
      .map((n) => ({
        type: "file",
        name: n.slice(prefix.length).replace(/\.md$/i, ""),
        path: n,
      }));
  }, [folders, notes, icons, activeFolder]);

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: tokens.color.bg.primary }}
    >
      {/* Folder Back Bar if inside a folder */}
      {activeFolder ? (
        <View className="flex-row items-center px-4 py-2">
          <Pressable
            onPress={() => setActiveFolder(null)}
            accessibilityRole="button"
            accessibilityLabel="Back to all files"
            className="flex-row items-center gap-1.5 active:opacity-60"
          >
            <ArrowLeft size={16} color={tokens.color.text.normal} weight="bold" />
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: tokens.color.text.normal,
              }}
            >
              {activeFolder}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* 2-Column Grid View (Header removed) */}
      <FlatList
        data={displayItems}
        key="folder-grid"
        numColumns={2}
        keyExtractor={(item) => `${item.type}-${item.path}`}
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingVertical: 8,
          paddingBottom: 48,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          item.type === "folder" ? (
            <FolderCardGridItem
              name={item.name}
              itemCount={item.count}
              icon={item.icon}
              onPress={() => setActiveFolder(item.path)}
              onOptionsPress={() => onDeleteFolder?.(item.path)}
            />
          ) : (
            <NoteCardGridItem
              title={item.name}
              dateStr="Note"
              onPress={() => onOpenNote(item.path)}
              onOptionsPress={() => onDeleteNote?.(item.path)}
            />
          )
        }
        ListEmptyComponent={
          <View className="p-8 items-center justify-center">
            <Text variant="caption" color="muted">
              {activeFolder ? `No notes in ${activeFolder}` : "No files or folders"}
            </Text>
          </View>
        }
      />
    </View>
  );
}
