import React, { useState } from "react";
import { View, FlatList } from "react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import { FolderViewHeader, type FolderDisplayMode } from "./FolderViewHeader";
import { NoteCardGridItem } from "./NoteCardGridItem";

export interface FolderNoteItem {
  id: string;
  path: string;
  title: string;
  dateStr: string;
  snippet?: string;
}

export interface FolderGridViewProps {
  notes: FolderNoteItem[];
  folderName?: string;
  onOpenNote: (path: string) => void;
  onDeleteNote?: (path: string) => void;
}

export function FolderGridView({
  notes,
  folderName = "Все файлы",
  onOpenNote,
  onDeleteNote,
}: FolderGridViewProps): React.ReactElement {
  const { tokens } = useTheme();
  const [displayMode, setDisplayMode] = useState<FolderDisplayMode>("grid");

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: tokens.color.bg.primary }}
    >
      <FolderViewHeader
        folderLabel={folderName}
        sortLabel="Последние"
        displayMode={displayMode}
        onChangeDisplayMode={setDisplayMode}
      />

      <FlatList
        data={notes}
        key={displayMode}
        numColumns={displayMode === "grid" ? 2 : 1}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingVertical: 8,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <NoteCardGridItem
            title={item.title}
            dateStr={item.dateStr}
            snippet={item.snippet}
            onPress={() => onOpenNote(item.path)}
            onOptionsPress={() => onDeleteNote?.(item.path)}
          />
        )}
        ListEmptyComponent={
          <View className="p-8 items-center justify-center">
            <Text variant="caption" color="muted">
              No notes in this folder
            </Text>
          </View>
        }
      />
    </View>
  );
}
