import React, { useState, useMemo } from "react";
import { View, FlatList, Pressable, RefreshControl, ScrollView } from "react-native";
import { Plus, Bell, CaretRight } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import { ReminderEventRow } from "./ReminderEventRow";
import { AddReminderModal } from "./AddReminderModal";
import { useVaultReminders } from "../../vault/useVaultReminders";
import type { MobileReminderEvent } from "./types";

export interface RemindersHubViewProps {
  onOpenNote?: (notePath: string) => void;
}

export function RemindersHubView({ onOpenNote }: RemindersHubViewProps): React.ReactElement {
  const { tokens } = useTheme();
  const {
    reminders,
    projects,
    selectedProject,
    setSelectedProject,
    metrics,
    isLoading,
    refresh,
    addReminder,
    toggleReminder,
    deleteReminder,
  } = useVaultReminders();

  const [addModalOpen, setAddModalOpen] = useState(false);

  const displayedReminders = useMemo(() => {
    if (selectedProject === "All") return reminders;
    return reminders.filter((r) => r.project.toLowerCase() === selectedProject.toLowerCase());
  }, [reminders, selectedProject]);

  return (
    <View className="flex-1" style={{ backgroundColor: tokens.color.bg.primary }}>
      {/* Top 3-metric Overview Card from Reference Image */}
      <View className="mx-4 mt-2 mb-4 p-4 rounded-2xl border" style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Next Reminder</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>{metrics.nextTime}</Text>
          </View>
          <View className="flex-1 items-center border-x" style={{ borderColor: "#f3f4f6" }}>
            <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Today</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>{metrics.todayCount} Items</Text>
          </View>
          <View className="flex-1 items-end">
            <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Upcoming</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>{metrics.upcomingCount} Total</Text>
          </View>
        </View>
      </View>

      {/* Section Header with "See All >" and Project Filter */}
      <View className="flex-row items-center justify-between px-4 mb-2">
        <Text style={{ fontSize: 19, fontWeight: "800", color: "#111827" }}>
          Reminders & Events
        </Text>
        <Pressable
          onPress={() => {
            const nextIdx = (projects.indexOf(selectedProject) + 1) % projects.length;
            setSelectedProject(projects[nextIdx] ?? "All");
          }}
          className="flex-row items-center px-3 py-1 rounded-full border active:opacity-75"
          style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb", gap: 4 }}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#111827" }}>
            {selectedProject === "All" ? "See All" : selectedProject}
          </Text>
          <CaretRight size={13} color="#111827" />
        </Pressable>
      </View>

      {/* Project Category Filter Chips */}
      <View className="mb-2 px-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
          {projects.map((p) => {
            const isSelected = selectedProject === p;
            return (
              <Pressable
                key={p}
                onPress={() => setSelectedProject(p)}
                className="mx-1 px-3 py-1 rounded-full border active:opacity-75"
                style={{
                  backgroundColor: isSelected ? "#000000" : "#ffffff",
                  borderColor: isSelected ? "#000000" : "#e5e7eb",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: isSelected ? "#ffffff" : "#4b5563",
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
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void refresh()} />}
        renderItem={({ item }) => (
          <ReminderEventRow
            item={item}
            onToggle={(it) => void toggleReminder(it)}
            onDelete={(it) => void deleteReminder(it)}
            onPress={(it) => it.notePath && onOpenNote && onOpenNote(it.notePath)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-16 px-6">
              <Bell size={44} color="#9ca3af" weight="thin" />
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#111827", marginTop: 12 }}>
                No reminders in {selectedProject}
              </Text>
              <Text style={{ fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 4 }}>
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
        className="absolute items-center justify-center active:scale-95 shadow-md"
        style={{
          bottom: 24,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: "#000000",
          elevation: 6,
        }}
      >
        <Plus size={22} color="#ffffff" weight="bold" />
      </Pressable>

      {/* Add Reminder Modal */}
      <AddReminderModal
        visible={addModalOpen}
        projects={projects}
        onClose={() => setAddModalOpen(false)}
        onAdd={(title, dateTime, project) => void addReminder(title, dateTime, project)}
      />
    </View>
  );
}
