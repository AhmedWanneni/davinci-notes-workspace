import React from "react";
import { View, TextInput, ScrollView, Pressable } from "react-native";
import { MagnifyingGlass, Funnel, X } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import type {
  MobileTodoDateFilter,
  MobileTodoProject,
  MobileTodoStatusFilter,
} from "./types";

export interface TodoFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: MobileTodoStatusFilter;
  onStatusFilterChange: (s: MobileTodoStatusFilter) => void;
  dateFilter: MobileTodoDateFilter;
  onDateFilterChange: (d: MobileTodoDateFilter) => void;
  selectedProjectId: string;
  onProjectChange: (pId: string) => void;
  projects: MobileTodoProject[];
}

export function TodoFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  selectedProjectId,
  onProjectChange,
  projects,
}: TodoFilterBarProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <View className="px-4 pb-2">
      {/* Search Bar */}
      <View
        className="flex-row items-center px-3 py-2 rounded-xl border mb-3"
        style={{
          backgroundColor: tokens.color.bg.secondary,
          borderColor: tokens.color.border.subtle,
        }}
      >
        <MagnifyingGlass size={16} color={tokens.color.text.muted} weight="regular" />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search todos and tasks..."
          placeholderTextColor={tokens.color.text.muted}
          className="flex-1 ml-2 text-sm"
          style={{ color: tokens.color.text.normal, paddingVertical: 0 }}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => onSearchChange("")} className="p-1">
            <X size={14} color={tokens.color.text.muted} weight="bold" />
          </Pressable>
        ) : null}
      </View>

      {/* Horizontal Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        {/* Status Chips */}
        {(["all", "pending", "completed"] as const).map((s) => {
          const isActive = statusFilter === s;
          const label = s === "all" ? "All" : s === "pending" ? "Pending" : "Done";
          return (
            <Pressable
              key={`status-${s}`}
              onPress={() => onStatusFilterChange(s)}
              className="mr-2 px-3 py-1.5 rounded-full border items-center justify-center active:opacity-70"
              style={{
                backgroundColor: isActive ? tokens.color.interactive.accent : tokens.color.bg.primary,
                borderColor: isActive ? tokens.color.interactive.accent : tokens.color.border.subtle,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: isActive ? tokens.color.text["on-accent"] : tokens.color.text.normal,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}

        <View
          className="mr-2"
          style={{ width: 1, height: 20, backgroundColor: tokens.color.border.subtle, alignSelf: "center" }}
        />

        {/* Date Chips */}
        {(["all", "today", "upcoming", "dated"] as const).map((d) => {
          const isActive = dateFilter === d;
          const label =
            d === "all" ? "Any Date" : d === "today" ? "Today" : d === "upcoming" ? "Upcoming" : "Dated";
          return (
            <Pressable
              key={`date-${d}`}
              onPress={() => onDateFilterChange(d)}
              className="mr-2 px-3 py-1.5 rounded-full border items-center justify-center active:opacity-70"
              style={{
                backgroundColor: isActive ? tokens.color.interactive.accent : tokens.color.bg.primary,
                borderColor: isActive ? tokens.color.interactive.accent : tokens.color.border.subtle,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: isActive ? tokens.color.text["on-accent"] : tokens.color.text.normal,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}

        {projects.length > 1 ? (
          <>
            <View
              className="mr-2"
              style={{ width: 1, height: 20, backgroundColor: tokens.color.border.subtle, alignSelf: "center" }}
            />
            {/* Project Chips */}
            {projects.map((p) => {
              const isActive = selectedProjectId === p.id;
              return (
                <Pressable
                  key={`proj-${p.id}`}
                  onPress={() => onProjectChange(p.id)}
                  className="mr-2 px-3 py-1.5 rounded-full border items-center justify-center active:opacity-70"
                  style={{
                    backgroundColor: isActive ? tokens.color.interactive.accent : tokens.color.bg.primary,
                    borderColor: isActive ? tokens.color.interactive.accent : tokens.color.border.subtle,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: isActive ? tokens.color.text["on-accent"] : tokens.color.text.normal,
                    }}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
