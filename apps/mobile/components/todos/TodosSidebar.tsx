import React, { useState, useMemo } from "react";
import { View, Modal, Pressable, ScrollView, Alert } from "react-native";
import {
  X,
  FolderSimplePlus,
  CheckSquare,
  MagnifyingGlass,
  Calendar,
  SquaresFour,
} from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
import { Text, Input } from "../primitives";
import { SidebarProjectItem } from "./SidebarProjectItem";
import type { MobileTodoProject } from "./types";

export interface TodosSidebarProps {
  visible: boolean;
  onClose: () => void;
  projects: MobileTodoProject[];
  openedTodoPath: string;
  onSelectTodoList: (notePath: string) => void;
  onAddProject: () => void;
  onAddTodoList: (projectName: string) => void;
  onDeleteProject?: (projectName: string) => void;
  onDeleteTodoList?: (notePath: string) => void;
  onSelectReminders?: () => void;
  onToggleGridMode?: () => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

export function TodosSidebar({
  visible,
  onClose,
  projects,
  openedTodoPath,
  onSelectTodoList,
  onAddProject,
  onAddTodoList,
  onDeleteProject,
  onDeleteTodoList,
  onSelectReminders,
  onToggleGridMode,
  searchQuery,
  onSearchQueryChange,
}: TodosSidebarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    daily: true,
  });
  const [localQuery, setLocalQuery] = useState("");

  const query = searchQuery !== undefined ? searchQuery : localQuery;
  const setQuery = onSearchQueryChange ?? setLocalQuery;

  const filteredProjects = useMemo(() => {
    if (!query.trim()) return projects;
    const q = query.toLowerCase();
    return projects
      .map((proj) => {
        const projMatches = proj.name.toLowerCase().includes(q);
        const matchingLists = proj.todoLists.filter((l) =>
          l.name.toLowerCase().includes(q),
        );
        if (projMatches) return proj;
        if (matchingLists.length > 0)
          return { ...proj, todoLists: matchingLists };
        return null;
      })
      .filter((p): p is MobileTodoProject => p !== null);
  }, [projects, query]);

  const confirmDeleteProject = (projectName: string) => {
    if (projectName.toLowerCase() === "daily") {
      Alert.alert(
        "Daily Project",
        "The default Daily project cannot be removed.",
      );
      return;
    }
    Alert.alert(
      "Delete Project",
      `Delete "${projectName}" and all its todo lists?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDeleteProject?.(projectName),
        },
      ],
    );
  };

  const confirmDeleteTodoList = (listName: string, notePath: string) => {
    Alert.alert("Delete Todo List", `Delete "${listName}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDeleteTodoList?.(notePath),
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          backgroundColor: tokens.color.bg.primary,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
        }}
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between px-4 pb-3 border-b"
          style={{ borderBottomColor: tokens.color.border.subtle }}
        >
          <View className="flex-row items-center gap-2">
            <CheckSquare
              size={22}
              color={tokens.color.text.normal}
              weight="bold"
            />
            <Text
              style={{
                fontSize: 19,
                fontWeight: "700",
                color: tokens.color.text.normal,
              }}
            >
              Projects & Todos
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={() => {
                onClose();
                onAddProject();
              }}
              accessibilityRole="button"
              accessibilityLabel="Add project folder"
              className="p-1.5 active:opacity-60"
            >
              <FolderSimplePlus size={22} color={tokens.color.text.normal} />
            </Pressable>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close page"
              className="p-1.5 active:opacity-60"
            >
              <X size={22} color={tokens.color.text.normal} />
            </Pressable>
          </View>
        </View>

        {/* Quick Nav: Calendar & 2-Column Card Grid */}
        <View className="px-3 pt-2 pb-1 gap-1.5">
          <Pressable
            onPress={() => {
              onClose();
              onSelectReminders?.();
            }}
            accessibilityRole="button"
            accessibilityLabel="Open Calendar and Reminders"
            className="flex-row items-center gap-2.5 px-3 py-2 rounded-xl active:bg-bg-hover"
            style={{ backgroundColor: tokens.color.bg.secondary }}
          >
            <Calendar
              size={18}
              color={tokens.color.interactive.accent}
              weight="bold"
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: tokens.color.text.normal,
              }}
            >
              Calendar & Reminders
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              onClose();
              onToggleGridMode?.();
            }}
            accessibilityRole="button"
            accessibilityLabel="Toggle 2-column card grid view"
            className="flex-row items-center gap-2.5 px-3 py-2 rounded-xl active:bg-bg-hover"
            style={{ backgroundColor: tokens.color.bg.secondary }}
          >
            <SquaresFour
              size={18}
              color={tokens.color.interactive.accent}
              weight="bold"
            />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: tokens.color.text.normal,
              }}
            >
              2-Column Card Grid View
            </Text>
          </Pressable>
        </View>

        {/* Projects and their Todo Lists */}
        <ScrollView
          className="flex-1 px-2 pt-1"
          showsVerticalScrollIndicator={false}
        >
          {filteredProjects.map((proj) => (
            <SidebarProjectItem
              key={proj.id}
              proj={proj}
              isExpanded={expanded[proj.id] ?? true}
              onToggleExpand={() =>
                setExpanded((prev) => ({
                  ...prev,
                  [proj.id]: !(prev[proj.id] ?? true),
                }))
              }
              onDeleteProject={confirmDeleteProject}
              onAddTodoList={(pName) => {
                onClose();
                onAddTodoList(pName);
              }}
              openedTodoPath={openedTodoPath}
              onSelectTodoList={(path) => {
                onSelectTodoList(path);
                onClose();
              }}
              onDeleteTodoList={confirmDeleteTodoList}
            />
          ))}
        </ScrollView>

        {/* Bottom Search Bar */}
        <View
          className="px-3 pt-2.5 border-t"
          style={{ borderTopColor: tokens.color.border.subtle }}
        >
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Search todos & projects..."
            placeholderTextColor={tokens.color.text.muted}
            prefix={
              <MagnifyingGlass size={18} color={tokens.color.text.muted} />
            }
            suffix={
              query.length > 0 ? (
                <Pressable onPress={() => setQuery("")} className="p-1">
                  <X size={16} color={tokens.color.text.muted} weight="bold" />
                </Pressable>
              ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );
}
