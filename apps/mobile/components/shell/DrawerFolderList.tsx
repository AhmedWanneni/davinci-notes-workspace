import React from "react";
import { ScrollView, Pressable, Alert } from "react-native";
import { FileText } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import { DrawerFolderItem } from "./DrawerFolderItem";

export interface DrawerFolderListProps {
  folders: string[];
  notes: string[];
  expandedFolders: Set<string>;
  icons: Record<string, string>;
  onToggleFolder: (folder: string) => void;
  onSelectFolder?: (folder: string) => void;
  onSelectNote: (path: string) => void;
  onDeleteFolder?: (folder: string) => void;
  onDeleteNote?: (path: string) => void;
  onPressIcon: (folder: string) => void;
}

export function DrawerFolderList({
  folders,
  notes,
  expandedFolders,
  icons,
  onToggleFolder,
  onSelectFolder,
  onSelectNote,
  onDeleteFolder,
  onDeleteNote,
  onPressIcon,
}: DrawerFolderListProps): React.ReactElement {
  const { tokens } = useTheme();

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
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 12,
        paddingVertical: 4,
      }}
      showsVerticalScrollIndicator={false}
    >
      {folders
        .slice()
        .sort()
        .filter(isFolderVisible)
        .map((folder) => {
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
              icon={icons[folder]}
              onToggleExpand={() => onToggleFolder(folder)}
              onSelectFolder={onSelectFolder}
              onSelectNote={onSelectNote}
              onDeleteFolder={onDeleteFolder}
              onDeleteNote={onDeleteNote}
              onPressIcon={onPressIcon}
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
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => onDeleteNote?.(note),
                },
              ]);
            }}
            className="flex-row items-center gap-2 px-3 py-2 rounded-lg active:bg-bg-hover min-h-[40px]"
          >
            <FileText size={18} color={tokens.color.text.muted} />
            <Text
              variant="body"
              color="normal"
              numberOfLines={1}
              className="flex-1"
              style={{ fontSize: 16 }}
            >
              {stem}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
