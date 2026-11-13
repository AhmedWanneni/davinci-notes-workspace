import React, { useState } from "react";
import { View, FlatList, RefreshControl, Pressable } from "react-native";
import {
  Plus,
  CheckSquare,
  List as ListIcon,
  SquaresFour,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import { TodoTaskRow } from "./TodoTaskRow";
import { TodoCardGridItem } from "./TodoCardGridItem";
import { CalendarWeekStrip } from "./CalendarWeekStrip";
import type { MobileTodoItem } from "./types";

export interface TodoListViewProps {
  listName: string;
  projectName: string;
  formattedDate: string;
  displayedTodos: MobileTodoItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  onToggle: (item: MobileTodoItem) => void;
  onDelete: (item: MobileTodoItem) => void;
  onOpenNote: (notePath: string) => void;
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
  onOpenAddItem: () => void;
  displayMode?: "list" | "grid";
  onChangeDisplayMode?: (mode: "list" | "grid") => void;
}

export function TodoListView({
  listName,
  projectName,
  formattedDate,
  displayedTodos,
  isLoading,
  refresh,
  onToggle,
  onDelete,
  onOpenNote,
  selectedDate,
  onSelectDate,
  onOpenAddItem,
  displayMode: controlledMode,
  onChangeDisplayMode,
}: TodoListViewProps): React.ReactElement {
  const { tokens } = useTheme();
  const [internalMode, setInternalMode] = useState<"list" | "grid">("grid");
  const displayMode = controlledMode ?? internalMode;

  const setMode = (mode: "list" | "grid") => {
    setInternalMode(mode);
    onChangeDisplayMode?.(mode);
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: tokens.color.bg.primary }}
    >
      {/* 7-Day Calendar Week Bar (same component as reminders) */}
      <CalendarWeekStrip
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />

      {/* Sub-row: Project / Todo list title, date, and Grid/List toggle */}
      <View
        className="flex-row items-center justify-between px-4 py-2 border-b"
        style={{ borderBottomColor: tokens.color.border.subtle }}
      >
        <View className="flex-row items-center gap-1.5 flex-1 mr-2">
          <Text style={{ fontSize: 14, color: tokens.color.text.muted }}>
            {projectName} /
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: tokens.color.text.normal,
            }}
          >
            {listName}
          </Text>
        </View>

        <View className="flex-row items-center gap-2.5">
          <Text
            style={{
              fontSize: 13,
              color: tokens.color.text.muted,
              fontWeight: "500",
            }}
          >
            {formattedDate}
          </Text>

          {/* List vs Grid Toggle */}
          <View
            className="flex-row items-center p-0.5 rounded-lg"
            style={{ backgroundColor: tokens.color.bg.secondary }}
          >
            <Pressable
              onPress={() => setMode("list")}
              accessibilityRole="button"
              accessibilityLabel="List view"
              className="w-7 h-7 rounded items-center justify-center active:opacity-75"
              style={{
                backgroundColor:
                  displayMode === "list"
                    ? tokens.color.bg.primary
                    : "transparent",
              }}
            >
              <ListIcon
                size={16}
                color={
                  displayMode === "list"
                    ? tokens.color.text.normal
                    : tokens.color.text.muted
                }
                weight={displayMode === "list" ? "bold" : "regular"}
              />
            </Pressable>

            <Pressable
              onPress={() => setMode("grid")}
              accessibilityRole="button"
              accessibilityLabel="Grid view"
              className="w-7 h-7 rounded items-center justify-center active:opacity-75"
              style={{
                backgroundColor:
                  displayMode === "grid"
                    ? tokens.color.bg.primary
                    : "transparent",
              }}
            >
              <SquaresFour
                size={16}
                color={
                  displayMode === "grid"
                    ? tokens.color.text.normal
                    : tokens.color.text.muted
                }
                weight={displayMode === "grid" ? "fill" : "regular"}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Task Rows List / Grid */}
      <FlatList
        key={displayMode}
        data={displayedTodos}
        numColumns={displayMode === "grid" ? 2 : 1}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => void refresh()}
          />
        }
        renderItem={({ item }) =>
          displayMode === "grid" ? (
            <TodoCardGridItem
              item={item}
              onToggle={onToggle}
              onDelete={onDelete}
              onOpenNote={onOpenNote}
            />
          ) : (
            <TodoTaskRow
              item={item}
              onToggle={onToggle}
              onDelete={onDelete}
              onOpenNote={onOpenNote}
            />
          )
        }
        contentContainerStyle={{
          paddingHorizontal: displayMode === "grid" ? 8 : 0,
          paddingVertical: displayMode === "grid" ? 6 : 0,
          paddingBottom: 48,
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-16 px-6">
              <CheckSquare
                size={44}
                color={tokens.color.text.muted}
                weight="thin"
              />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: tokens.color.text.normal,
                  marginTop: 12,
                }}
              >
                No items in {listName}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: tokens.color.text.muted,
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
                Tap + below to add an item directly to this todo list.
              </Text>
            </View>
          ) : undefined
        }
      />

      {/* Floating Add Item Button */}
      <Pressable
        onPress={onOpenAddItem}
        accessibilityRole="button"
        accessibilityLabel={`Add item to ${listName}`}
        className="absolute items-center justify-center active:scale-95 shadow-md w-12 h-12 rounded-full"
        style={{
          bottom: 24,
          right: 24,
          backgroundColor: tokens.color.interactive.accent,
          elevation: 6,
        }}
      >
        <Plus size={22} color={tokens.color.text["on-accent"]} weight="bold" />
      </Pressable>
    </View>
  );
}
