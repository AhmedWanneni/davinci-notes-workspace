import React from "react";
import { View, FlatList, RefreshControl, Pressable } from "react-native";
import { Plus, CheckSquare } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import { TodoCardGridItem } from "./TodoCardGridItem";
import { CalendarMonthTable } from "./CalendarMonthTable";
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
  taskDates?: Set<string>;
  isCalendarVisible?: boolean;
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
  taskDates,
  isCalendarVisible = false,
}: TodoListViewProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: tokens.color.bg.primary }}
    >
      {/* Complete Calendar Month Table toggled via top header */}
      {isCalendarVisible ? (
        <CalendarMonthTable
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          taskDates={taskDates}
        />
      ) : null}

      {/* Sub-row: Project / Todo list title and date */}
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

        <Text
          style={{
            fontSize: 13,
            color: tokens.color.text.muted,
            fontWeight: "500",
          }}
        >
          {formattedDate}
        </Text>
      </View>

      {/* 2-Column Task Cards Grid */}
      <FlatList
        key="todo-2-column-grid"
        data={displayedTodos}
        numColumns={2}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => void refresh()}
          />
        }
        renderItem={({ item }) => (
          <TodoCardGridItem
            item={item}
            onToggle={onToggle}
            onDelete={onDelete}
            onOpenNote={onOpenNote}
          />
        )}
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingVertical: 8,
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
        className="absolute items-center justify-center active:scale-95 w-12 h-12 rounded-full"
        style={{
          bottom: 24,
          right: 24,
          backgroundColor: tokens.color.interactive.accent,
        }}
      >
        <Plus size={22} color={tokens.color.text["on-accent"]} weight="bold" />
      </Pressable>
    </View>
  );
}
