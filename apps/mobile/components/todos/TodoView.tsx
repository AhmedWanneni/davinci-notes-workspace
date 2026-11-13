import React, { useState, useMemo } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { Plus, NotePencil, CheckSquare } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import { TodoHeader } from "./TodoHeader";
import { TodoCalendarStrip } from "./TodoCalendarStrip";
import { TodoReminderBanner } from "./TodoReminderBanner";
import { TodoItemCard } from "./TodoItemCard";
import { AddTodoModal } from "./AddTodoModal";
import {
  parseTodosFromMarkdown,
  toggleTodoInMarkdown,
  appendTodoToMarkdown,
} from "./todoParser";
import type { MobileTodoItem } from "./types";
import { getTextDirection } from "../../src/getTextDirection";

export interface TodoViewProps {
  content: string;
  onContentChange: (newContent: string) => void;
  onSwitchToEditor?: () => void;
  title?: string;
}

export function TodoView({
  content,
  onContentChange,
  onSwitchToEditor,
  title = "Todos",
}: TodoViewProps): React.ReactElement {
  const { tokens } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addModalVisible, setAddModalVisible] = useState(false);

  const sections = useMemo(() => {
    const parsed = parseTodosFromMarkdown(content);
    if (parsed.length === 0) {
      return [
        {
          name: "Daily routine",
          todos: [
            {
              id: "default-1",
              text: "Drink a glass of water",
              completed: true,
              lineIndex: -1,
              section: "Daily routine",
              duration: "5 min",
              streakDays: 3,
              iconName: "water" as const,
            },
            {
              id: "default-2",
              text: "Meditate to relax",
              completed: true,
              lineIndex: -1,
              section: "Daily routine",
              duration: "15 min",
              streakDays: 6,
              iconName: "bicycle" as const,
            },
            {
              id: "default-3",
              text: "Stretch for 10 minutes",
              completed: false,
              lineIndex: -1,
              section: "Daily routine",
              duration: "10 min",
              streakDays: 5,
              iconName: "stretch" as const,
            },
            {
              id: "default-4",
              text: "Go for a short walk",
              completed: false,
              lineIndex: -1,
              section: "Daily routine",
              duration: "20 min",
              streakDays: 3,
              iconName: "walk" as const,
            },
          ],
        },
      ];
    }
    return parsed;
  }, [content]);

  const targetSection = sections[0]?.name ?? "Daily routine";

  const handleToggle = (item: MobileTodoItem) => {
    if (item.lineIndex >= 0) {
      const nextContent = toggleTodoInMarkdown(content, item.lineIndex, !item.completed);
      onContentChange(nextContent);
    } else {
      const nextContent = appendTodoToMarkdown(
        content,
        targetSection,
        item.text,
        item.duration,
      );
      onContentChange(nextContent);
    }
  };

  const handleAddTodo = (text: string, duration: string, reminder?: string) => {
    const nextContent = appendTodoToMarkdown(
      content,
      targetSection,
      text,
      duration,
      reminder,
    );
    onContentChange(nextContent);
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: "#ffffff", direction: getTextDirection(content) }}
    >
      {/* Top Header */}
      <TodoHeader userName={title !== "Todos" ? title : "Budi"} date={selectedDate} />

      {/* Week Calendar Strip */}
      <TodoCalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Set the reminder Banner */}
        <TodoReminderBanner onSetReminder={() => setAddModalVisible(true)} />

        {/* List Sections */}
        {sections.map((section, sIdx) => {
          const isFirstSection = sIdx === 0;
          const completedCount = section.todos.filter((t) => t.completed).length;
          return (
            <View key={`${section.name}-${sIdx}`}>
              <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
                <Text style={{ fontSize: 18, fontWeight: "700", color: tokens.color.text.normal }}>
                  {section.name}
                </Text>
                {isFirstSection && onSwitchToEditor ? (
                  <Pressable onPress={onSwitchToEditor} className="py-1 px-2 active:opacity-60">
                    <Text style={{ fontSize: 13, fontWeight: "500", color: tokens.color.text.muted }}>
                      Markdown view
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={{ fontSize: 13, fontWeight: "500", color: tokens.color.text.muted }}>
                    {completedCount}/{section.todos.length}
                  </Text>
                )}
              </View>

              <View className="pt-1">
                {section.todos.map((item, idx) => (
                  <TodoItemCard
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    isFirst={idx === 0}
                    isLast={idx === section.todos.length - 1}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Floating Action Button (FAB) `+` in bottom right matching Image */}
      <Pressable
        onPress={() => setAddModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Add new routine"
        className="absolute items-center justify-center active:scale-95"
        style={{
          bottom: 24,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#4a2810",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 6,
        }}
      >
        <Plus size={26} color="#ffffff" weight="bold" />
      </Pressable>

      {/* Add Routine Modal */}
      <AddTodoModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAddTodo={handleAddTodo}
      />
    </View>
  );
}
