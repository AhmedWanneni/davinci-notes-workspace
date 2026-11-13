import React, { useState, useMemo } from "react";
import { View, ScrollView, Pressable, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CaretLeft,
  CaretRight,
  X,
  Check,
  CalendarBlank,
  Clock,
  FolderSimple,
  Plus,
  ArrowSquareOut,
  Flame,
} from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import type { MobileTodoItem } from "./types";

export interface TodoFocusViewProps {
  visible: boolean;
  item: MobileTodoItem | null;
  allTodos: MobileTodoItem[];
  onClose: () => void;
  onToggleTodo: (item: MobileTodoItem) => void;
  onSelectTodo: (item: MobileTodoItem) => void;
  onOpenNote?: (notePath: string) => void;
  onAddTask?: (project: string) => void;
}

export function TodoFocusView({
  visible,
  item,
  allTodos,
  onClose,
  onToggleTodo,
  onSelectTodo,
  onOpenNote,
  onAddTask,
}: TodoFocusViewProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const formattedDate = useMemo(() => ({
    dayName: currentDate.toLocaleDateString("en-US", { weekday: "long" }),
    fullDate: currentDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }),
  }), [currentDate]);

  const handleShiftDay = (delta: number) => {
    setCurrentDate((prev) => { const next = new Date(prev); next.setDate(next.getDate() + delta); return next; });
  };

  const projectSiblings = useMemo(() => {
    if (!item?.project) return [];
    return allTodos.filter((t) => t.project === item.project && t.id !== item.id);
  }, [item, allTodos]);

  if (!visible || !item) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1" style={{ backgroundColor: "#ffffff", paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* Top Header */}
        <View className="h-[48px] flex-row items-center justify-between px-4 border-b border-border-subtle">
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Back" className="flex-row items-center py-2 pr-2 active:opacity-60">
            <CaretLeft size={20} color="#000000" />
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#000000", marginLeft: 4 }}>Tasks</Text>
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: "700", color: tokens.color.text.normal }}>Focus Mode</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" className="p-1 active:opacity-60">
            <X size={20} color="#000000" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          {/* Date Navigator Header */}
          <View className="flex-row items-center justify-between py-2 mb-4 bg-bg-secondary rounded-2xl px-4">
            <Pressable onPress={() => handleShiftDay(-1)} className="p-2 active:opacity-60"><CaretLeft size={20} color="#000000" /></Pressable>
            <View className="items-center">
              <Text style={{ fontSize: 18, fontWeight: "700", color: tokens.color.text.normal }}>{formattedDate.dayName}</Text>
              <Text style={{ fontSize: 12, color: tokens.color.text.muted, marginTop: 2 }}>{formattedDate.fullDate}</Text>
            </View>
            <Pressable onPress={() => handleShiftDay(1)} className="p-2 active:opacity-60"><CaretRight size={20} color="#000000" /></Pressable>
          </View>

          {/* Prominent Focused Todo Card */}
          <View
            className="p-5 rounded-3xl border mb-6 shadow-sm"
            style={{
              backgroundColor: item.completed ? "#f9f9f9" : "#ffffff",
              borderColor: item.completed ? tokens.color.border.subtle : tokens.color.border.normal,
            }}
          >
            <View className="flex-row items-start justify-between">
              <Pressable
                onPress={() => onToggleTodo(item)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.completed }}
                className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5"
                style={{
                  borderWidth: item.completed ? 0 : 2,
                  borderColor: item.completed ? "transparent" : tokens.color.border.normal,
                  backgroundColor: item.completed ? tokens.color.interactive.accent : "transparent",
                }}
              >
                {item.completed ? <Check size={18} color="#ffffff" weight="bold" /> : null}
              </Pressable>

              <View className="flex-1">
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: item.completed ? tokens.color.text.muted : tokens.color.text.normal,
                    textDecorationLine: item.completed ? "line-through" : "none",
                    lineHeight: 28,
                    marginBottom: 12,
                  }}
                >
                  {item.text}
                </Text>

                <View className="flex-row items-center flex-wrap gap-2">
                  {item.project ? (
                    <View className="flex-row items-center px-2.5 py-1 rounded-full bg-bg-secondary">
                      <FolderSimple size={13} color={tokens.color.text.muted} />
                      <Text style={{ fontSize: 12, color: tokens.color.text.muted, marginLeft: 4 }}>{item.project}</Text>
                    </View>
                  ) : null}
                  {item.dueDate || item.reminder ? (
                    <View className="flex-row items-center px-2.5 py-1 rounded-full bg-interactive-accent/10">
                      <CalendarBlank size={13} color={tokens.color.interactive.accent} />
                      <Text style={{ fontSize: 12, color: tokens.color.interactive.accent, fontWeight: "600", marginLeft: 4 }}>
                        {item.dueDate ?? item.reminder}
                      </Text>
                    </View>
                  ) : null}
                  {item.duration ? (
                    <View className="flex-row items-center px-2.5 py-1 rounded-full bg-bg-secondary">
                      <Clock size={13} color={tokens.color.text.muted} />
                      <Text style={{ fontSize: 12, color: tokens.color.text.muted, marginLeft: 4 }}>{item.duration}</Text>
                    </View>
                  ) : null}
                  {item.streakDays ? (
                    <View className="flex-row items-center px-2.5 py-1 rounded-full bg-accent-warning/10">
                      <Flame size={13} color="#d97736" weight="fill" />
                      <Text style={{ fontSize: 12, color: "#d97736", fontWeight: "600", marginLeft: 4 }}>{item.streakDays} days</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {item.notePath && onOpenNote ? (
              <Pressable
                onPress={() => { onClose(); onOpenNote(item.notePath!); }}
                className="mt-5 pt-3 border-t border-border-subtle flex-row items-center justify-between active:opacity-60"
              >
                <Text style={{ fontSize: 13, color: tokens.color.interactive.accent, fontWeight: "600" }}>Open note in markdown editor</Text>
                <ArrowSquareOut size={16} color={tokens.color.interactive.accent} />
              </Pressable>
            ) : null}
          </View>

          {/* Sibling Tasks in Same Project to Surf and Choose */}
          {projectSiblings.length > 0 ? (
            <View className="mb-6">
              <View className="flex-row items-center justify-between pb-2">
                <Text style={{ fontSize: 15, fontWeight: "700", color: tokens.color.text.normal }}>Other tasks in {item.project}</Text>
                <Text style={{ fontSize: 12, color: tokens.color.text.muted }}>Tap to switch focus</Text>
              </View>

              {projectSiblings.map((sibling) => (
                <Pressable
                  key={sibling.id}
                  onPress={() => onSelectTodo(sibling)}
                  className="py-3 border-b border-border-subtle flex-row items-center justify-between active:bg-bg-hover"
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    <Pressable
                      onPress={() => onToggleTodo(sibling)}
                      className="w-5 h-5 rounded-full items-center justify-center mr-2.5"
                      style={{
                        borderWidth: sibling.completed ? 0 : 1.5,
                        borderColor: sibling.completed ? "transparent" : tokens.color.border.normal,
                        backgroundColor: sibling.completed ? tokens.color.interactive.accent : "transparent",
                      }}
                    >
                      {sibling.completed ? <Check size={11} color="#ffffff" weight="bold" /> : null}
                    </Pressable>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 14,
                        color: sibling.completed ? tokens.color.text.muted : tokens.color.text.normal,
                        textDecorationLine: sibling.completed ? "line-through" : "none",
                      }}
                    >
                      {sibling.text}
                    </Text>
                  </View>
                  <CaretRight size={14} color={tokens.color.text.muted} />
                </Pressable>
              ))}
            </View>
          ) : null}

          {/* Add another task to this project */}
          {onAddTask && item.project ? (
            <Pressable
              onPress={() => { onClose(); onAddTask(item.project!); }}
              className="py-3 px-4 rounded-xl border border-dashed border-border-normal flex-row items-center justify-center gap-2 active:bg-bg-hover mb-8"
            >
              <Plus size={16} color={tokens.color.text.normal} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: tokens.color.text.normal }}>Add another task to {item.project}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
