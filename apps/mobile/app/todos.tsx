import React, { useState, useMemo, useCallback } from "react";
import { View, FlatList, RefreshControl, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { List, MagnifyingGlass, X, Plus, CheckSquare } from "phosphor-react-native";
import { useTheme } from "../theme";
import { Text } from "../components/primitives";
import {
  TodoTaskRow,
  TodosSidebar,
  AddTodoItemModal,
  AddProjectModal,
  AddTodoListModal,
  RemindersHubView,
  type MobileTodoItem,
} from "../components/todos";
import { useVaultTodos } from "../vault/useVaultTodos";

export default function TodosScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();

  const {
    todos, projects, openedTodoPath, setOpenedTodoPath, isLoading,
    refresh, toggleTodo, deleteTodo, addTodoItem, createProject, createTodoList,
    deleteProject, deleteTodoList,
  } = useVaultTodos();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"reminders" | "todos">("reminders");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [addItemVisible, setAddItemVisible] = useState(false);
  const [addProjectVisible, setAddProjectVisible] = useState(false);
  const [addTodoListVisible, setAddTodoListVisible] = useState(false);
  const [projectForNewList, setProjectForNewList] = useState("Daily");

  const formattedDate = useMemo(() => new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }), []);

  const openedList = useMemo(() => {
    return projects.flatMap((p) => p.todoLists).find((l) => l.notePath === openedTodoPath);
  }, [projects, openedTodoPath]);

  const listName = openedList?.name ?? "Today";
  const projectName = openedList?.projectName ?? "Daily";

  const displayedTodos = useMemo(() => {
    return todos.filter((item) => {
      if (searchQuery.trim().length > 0) {
        return item.text.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return item.notePath === openedTodoPath;
    });
  }, [todos, searchQuery, openedTodoPath]);

  const handleToggle = useCallback((item: MobileTodoItem) => {
    if (item.notePath) void toggleTodo(item.notePath, item.lineIndex, !item.completed);
  }, [toggleTodo]);

  const handleDelete = useCallback((item: MobileTodoItem) => {
    if (item.notePath) void deleteTodo(item.notePath, item.lineIndex);
  }, [deleteTodo]);

  const handleOpenNote = useCallback((notePath: string) => {
    router.push({ pathname: "/editor", params: { path: notePath, mode: "edit" } });
  }, [router]);

  return (
    <View className="flex-1" style={{ backgroundColor: tokens.color.bg.primary, paddingTop: insets.top }}>
      {/* Top Header: Sidebar icon & Tabs Switcher */}
      <View className="flex-row items-center px-4 pt-3 pb-2.5" style={{ gap: 12 }}>
        <Pressable onPress={() => setSidebarVisible(true)} accessibilityRole="button" accessibilityLabel="Open sidebar" className="p-1 -ml-1 active:opacity-60">
          <List size={26} color="#000000" weight="regular" />
        </Pressable>
        <View className="flex-1 flex-row p-1 rounded-xl" style={{ backgroundColor: tokens.color.bg.secondary }}>
          <Pressable
            onPress={() => setActiveTab("reminders")}
            className="flex-1 py-1.5 rounded-lg items-center justify-center"
            style={{ backgroundColor: activeTab === "reminders" ? "#000000" : "transparent" }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: activeTab === "reminders" ? "#ffffff" : tokens.color.text.muted }}>
              Reminders & Events
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("todos")}
            className="flex-1 py-1.5 rounded-lg items-center justify-center"
            style={{ backgroundColor: activeTab === "todos" ? "#000000" : "transparent" }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: activeTab === "todos" ? "#ffffff" : tokens.color.text.muted }}>
              Todos & Projects
            </Text>
          </Pressable>
        </View>
      </View>

      {activeTab === "reminders" ? (
        <RemindersHubView onOpenNote={handleOpenNote} />
      ) : (
        <>
          {/* Search bar */}
          <View className="flex-row items-center px-4 py-1.5" style={{ gap: 8 }}>
            <View className="flex-1 flex-row items-center px-3.5 py-2 rounded-2xl" style={{ backgroundColor: tokens.color.bg.secondary, minHeight: 44 }}>
              <MagnifyingGlass size={18} color={tokens.color.text.muted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={`Search in ${listName}...`}
                placeholderTextColor={tokens.color.text.muted}
                className="flex-1 ml-2.5"
                style={{ color: tokens.color.text.normal, paddingVertical: 0, fontSize: 15 }}
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery("")} className="p-1"><X size={16} color={tokens.color.text.muted} weight="bold" /></Pressable>
              ) : null}
            </View>
          </View>

          {/* Sub-row: Project / Todo list title and date */}
          <View className="flex-row items-center justify-between px-4 py-2 border-b" style={{ borderBottomColor: tokens.color.border.subtle }}>
            <View className="flex-row items-center gap-1.5">
              <Text style={{ fontSize: 14, color: tokens.color.text.muted }}>{projectName} /</Text>
              <Text style={{ fontSize: 15, fontWeight: "700", color: tokens.color.text.normal }}>{listName}</Text>
            </View>
            <Text style={{ fontSize: 13, color: tokens.color.text.muted, fontWeight: "500" }}>{formattedDate}</Text>
          </View>

          {/* Task Rows List */}
          <FlatList
            data={displayedTodos}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => void refresh()} />}
            renderItem={({ item }) => (
              <TodoTaskRow
                item={item}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onOpenNote={handleOpenNote}
              />
            )}
            contentContainerStyle={{ paddingBottom: 90 }}
            ListEmptyComponent={!isLoading ? (
              <View className="items-center justify-center py-16 px-6">
                <CheckSquare size={44} color={tokens.color.text.muted} weight="thin" />
                <Text style={{ fontSize: 15, fontWeight: "600", color: tokens.color.text.normal, marginTop: 12 }}>No items in {listName}</Text>
                <Text style={{ fontSize: 12, color: tokens.color.text.muted, textAlign: "center", marginTop: 4 }}>
                  Tap + below to add an item directly to this todo list.
                </Text>
              </View>
            ) : undefined}
          />

          {/* Floating Add Item Button: adds directly to the opened todo list */}
          <Pressable
            onPress={() => setAddItemVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`Add item to ${listName}`}
            className="absolute items-center justify-center active:scale-95 shadow-md"
            style={{ bottom: 24, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: tokens.color.interactive.accent, elevation: 6 }}
          >
            <Plus size={22} color={tokens.color.text["on-accent"]} weight="bold" />
          </Pressable>
        </>
      )}

      {/* Todos Sidebar (Projects, Lists, + Project, + List, hold to delete) */}
      <TodosSidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        projects={projects}
        openedTodoPath={openedTodoPath}
        onSelectTodoList={(path) => {
          setOpenedTodoPath(path);
          setActiveTab("todos");
        }}
        onSelectReminders={() => setActiveTab("reminders")}
        onAddProject={() => setAddProjectVisible(true)}
        onAddTodoList={(pName) => {
          setProjectForNewList(pName);
          setAddTodoListVisible(true);
        }}
        onDeleteProject={(pName) => void deleteProject(pName)}
        onDeleteTodoList={(path) => void deleteTodoList(path)}
      />

      {/* Add Item to opened todo modal */}
      <AddTodoItemModal
        visible={addItemVisible}
        todoListName={listName}
        onClose={() => setAddItemVisible(false)}
        onAddItem={(text, duration, reminder) => void addTodoItem(openedTodoPath, text, duration, reminder)}
      />

      {/* Add Project Modal */}
      <AddProjectModal
        visible={addProjectVisible}
        onClose={() => setAddProjectVisible(false)}
        onCreateProject={(pName) => void createProject(pName)}
      />

      {/* Add Todo List to Project Modal */}
      <AddTodoListModal
        visible={addTodoListVisible}
        projectName={projectForNewList}
        onClose={() => setAddTodoListVisible(false)}
        onCreateTodoList={(pName, lName) => void createTodoList(pName, lName)}
      />
    </View>
  );
}
