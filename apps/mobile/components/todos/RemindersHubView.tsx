import React, { useState, useMemo } from "react";
import {
  View,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Plus, Bell } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import { ReminderEventRow } from "./ReminderEventRow";
import { AddReminderModal } from "./AddReminderModal";
import { CalendarWeekStrip } from "./CalendarWeekStrip";
import { useVaultReminders } from "../../vault/useVaultReminders";

export interface RemindersHubViewProps {
  onOpenNote?: (notePath: string) => void;
}

const toIso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function RemindersHubView({
  onOpenNote,
}: RemindersHubViewProps): React.ReactElement {
  const { tokens } = useTheme();
  const {
    reminders,
    projects,
    selectedProject,
    setSelectedProject,
    isLoading,
    refresh,
    addReminder,
    toggleReminder,
    deleteReminder,
  } = useVaultReminders();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    toIso(new Date()),
  );

  const displayedReminders = useMemo(() => {
    let list = reminders;
    if (selectedProject !== "All") {
      list = list.filter(
        (r) => r.project.toLowerCase() === selectedProject.toLowerCase(),
      );
    }
    if (selectedDate) {
      const filtered = list.filter((r) => r.dateTime?.startsWith(selectedDate));
      if (filtered.length > 0) return filtered;
      if (list.some((r) => /^\d{4}-\d{2}-\d{2}/.test(r.dateTime))) return [];
    }
    return list;
  }, [reminders, selectedProject, selectedDate]);

  const emptyText = selectedDate
    ? `No reminders for ${selectedDate}`
    : `No reminders in ${selectedProject}`;

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: tokens.color.bg.primary }}
    >
      {/* 7-Day Calendar Week Bar */}
      <CalendarWeekStrip
        selectedDate={selectedDate}
        onSelectDate={(iso) =>
          setSelectedDate((prev) => (prev === iso ? null : iso))
        }
      />

      {/* Project Category Filter Chips */}
      <View className="mb-2 px-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-1"
        >
          {projects.map((p) => {
            const isSel = selectedProject === p;
            return (
              <Pressable
                key={p}
                onPress={() => setSelectedProject(p)}
                className="mx-1 px-3 py-1 rounded-full active:opacity-75"
                style={{
                  backgroundColor: isSel
                    ? tokens.color.interactive.accent
                    : tokens.color.bg.secondary,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: isSel
                      ? tokens.color.text["on-accent"]
                      : tokens.color.text.muted,
                  }}
                >
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Reminders List */}
      <FlatList
        data={displayedReminders}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => void refresh()}
          />
        }
        renderItem={({ item }) => (
          <ReminderEventRow
            item={item}
            onToggle={(it) => void toggleReminder(it)}
            onDelete={(it) => void deleteReminder(it)}
            onPress={(it) => onOpenNote?.(it.notePath || "Reminders/Events.md")}
          />
        )}
        contentContainerStyle={{ paddingBottom: 48 }}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-16 px-6">
              <Bell size={44} color={tokens.color.text.muted} weight="thin" />
              <Text
                className="text-[15px] font-semibold mt-3"
                style={{ color: tokens.color.text.normal }}
              >
                {emptyText}
              </Text>
              <Text
                className="text-xs text-center mt-1"
                style={{ color: tokens.color.text.muted }}
              >
                Tap + below to schedule a new reminder or event.
              </Text>
            </View>
          ) : undefined
        }
      />

      {/* Floating Add Reminder Button */}
      <Pressable
        onPress={() => setAddModalOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Add Reminder"
        className="absolute items-center justify-center active:scale-95 w-12 h-12 rounded-full"
        style={{
          bottom: 24,
          right: 24,
          backgroundColor: tokens.color.interactive.accent,
        }}
      >
        <Plus size={22} color={tokens.color.text["on-accent"]} weight="bold" />
      </Pressable>

      {/* Add Reminder Modal */}
      <AddReminderModal
        visible={addModalOpen}
        projects={projects}
        onClose={() => setAddModalOpen(false)}
        onAdd={(t, dt, p) => void addReminder(t, dt, p)}
      />
    </View>
  );
}
