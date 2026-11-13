import React, { useState, useMemo } from "react";
import { View, Modal, Pressable, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { X, MagnifyingGlass } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
import { Input } from "../primitives";
import { EditorBottomBar } from "../EditorBottomBar";
import { TodosSidebarHeader } from "./TodosSidebarHeader";
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
  searchQuery,
  onSearchQueryChange,
}: TodosSidebarProps): React.ReactElement {
  const router = useRouter();
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
      `Delete "${projectName}" and all its lists?`,
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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar style={tokens.isDark ? "light" : "dark"} />
      <View
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          backgroundColor: tokens.color.bg.primary,
          paddingTop: insets.top,
        }}
      >
        <TodosSidebarHeader onClose={onClose} onAddProject={onAddProject} />

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

        <View
          className="px-3 py-2 border-t"
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

        <EditorBottomBar
          onTodo={onClose}
          onNewNote={() => {
            onClose();
            router.push({
              pathname: "/editor",
              params: { preset: "new", autoFocus: "1" },
            });
          }}
          onSearch={() => {
            onClose();
            router.push("/search");
          }}
          onNotifications={() => {
            onClose();
            router.push({ pathname: "/todos", params: { tab: "reminders" } });
          }}
          onTabs={() => {
            onClose();
            router.push("/editor");
          }}
          onMenu={() => {
            onClose();
            router.push("/settings");
          }}
          tabCount={1}
        />
      </View>
    </Modal>
  );
}
