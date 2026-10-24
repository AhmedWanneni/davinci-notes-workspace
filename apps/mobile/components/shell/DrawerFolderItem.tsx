import React from "react";
import { View, Pressable } from "react-native";
import {
  FolderSimple,
  CaretRight,
  CaretDown,
  FileText,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface DrawerFolderItemProps {
  folder: string;
  displayName: string;
  depth?: number;
  isExpanded: boolean;
  notes: string[];
  onToggleExpand: () => void;
  onSelectFolder?: (folder: string) => void;
  onSelectNote: (path: string) => void;
}

export function DrawerFolderItem({
  folder,
  displayName,
  depth = 0,
  isExpanded,
  notes,
  onToggleExpand,
  onSelectFolder,
  onSelectNote,
}: DrawerFolderItemProps): React.ReactElement {
  const { tokens } = useTheme();
  const indentPadding = Math.min(depth * 14, 42);

  const handlePressFolder = () => {
    if (onSelectFolder) {
      onSelectFolder(folder);
    } else {
      onToggleExpand();
    }
  };

  return (
    <View className="mb-0.5">
      <View
        className="flex-row items-center justify-between rounded-lg active:bg-bg-hover min-h-[40px] px-2"
        style={{ paddingLeft: 8 + indentPadding }}
      >
        <Pressable
          onPress={onToggleExpand}
          className="p-1.5 rounded active:bg-bg-hover"
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? "Collapse folder" : "Expand folder"}
        >
          {isExpanded ? (
            <CaretDown size={14} color={tokens.color.text.muted} />
          ) : (
            <CaretRight size={14} color={tokens.color.text.muted} />
          )}
        </Pressable>

        <Pressable
          onPress={handlePressFolder}
          className="flex-1 flex-row items-center gap-2 py-2"
          accessibilityRole="button"
          accessibilityLabel={`Open folder ${displayName}`}
        >
          <FolderSimple size={18} color={tokens.color.interactive.accent} />
          <Text
            variant="body"
            color="normal"
            numberOfLines={1}
            className="flex-1"
          >
            {displayName}
          </Text>
          {notes.length > 0 ? (
            <Text variant="caption" color="muted" className="pr-1">
              {notes.length}
            </Text>
          ) : null}
        </Pressable>
      </View>

      {isExpanded ? (
        <View className="ml-2">
          {notes.length === 0 ? (
            <View
              className="py-1 px-3"
              style={{ paddingLeft: 24 + indentPadding }}
            >
              <Text variant="caption" color="muted">
                Empty folder
              </Text>
            </View>
          ) : (
            notes.map((note) => {
              const stem = note.split("/").pop()?.replace(/\.md$/i, "") ?? note;
              return (
                <Pressable
                  key={note}
                  onPress={() => onSelectNote(note)}
                  className="flex-row items-center gap-2 py-2 px-3 rounded-lg active:bg-bg-hover min-h-[36px]"
                  style={{ paddingLeft: 24 + indentPadding }}
                  accessibilityRole="button"
                  accessibilityLabel={`Open note ${stem}`}
                >
                  <FileText size={16} color={tokens.color.text.muted} />
                  <Text
                    variant="body"
                    color="normal"
                    numberOfLines={1}
                    className="flex-1 text-sm"
                  >
                    {stem}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      ) : null}
    </View>
  );
}
