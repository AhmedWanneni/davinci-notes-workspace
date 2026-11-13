import React, { useState, useMemo } from "react";
import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { List } from "phosphor-react-native";
import { useTheme } from "../theme";
import { Text } from "../components/primitives";
import {
  TodoListView,
  TodosSidebar,
  AddTodoItemModal,
  AddProjectModal,
  AddTodoListModal,
  RemindersHubView,
  type MobileTodoItem,
} from "../components/todos";
import { useVaultTodos } from "../vault/useVaultTodos";

const toIso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function TodosScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();

  const {
    todos,
    projects,
    openedTodoPath,
    setOpenedTodoPath,
    isLoading,
    refresh,
    toggleTodo,
    deleteTodo,
    addTodoItem,
    createProject,
    createTodoList,
    deleteProject,
    deleteTodoList,
  } = useVaultTodos();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(() =>
    toIso(new Date()),
  );
  const [activeTab, setActiveTab] = useState<"reminders" | "todos">(
    "reminders",
  );
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [addItemVisible, setAddItemVisible] = useState(false);
  const [addProjectVisible, setAddProjectVisible] = useState(false);
  const [addTodoListVisible, setAddTodoListVisible] = useState(false);
  const [projectForNewList, setProjectForNewList] = useState("Daily");

  const formattedDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    [],
  );

  const openedList = useMemo(
    () =>
      projects
        .flatMap((p) => p.todoLists)
        .find((l) => l.notePath === openedTodoPath),
    [projects, openedTodoPath],
  );

  const listName = openedList?.name ?? "Today";
  const projectName = openedList?.projectName ?? "Daily";

  const displayedTodos = useMemo(() => {
    let list = todos;
    if (searchQuery.trim().length > 0) {
      list = list.filter((item) =>
        item.text.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    } else {
      list = list.filter((item) => item.notePath === openedTodoPath);
    }
    if (selectedDate) {
      const dateMatches = list.filter(
        (item) =>
          item.dueDate === selectedDate ||
          item.reminder?.startsWith(selectedDate),
      );
      if (dateMatches.length > 0) return dateMatches;
      if (list.some((item) => item.dueDate || item.reminder)) return [];
    }
    return list;
  }, [todos, searchQuery, openedTodoPath, selectedDate]);

  const handleToggle = (item: MobileTodoItem) =>
    item.notePath &&
    void toggleTodo(item.notePath, item.lineIndex, !item.completed);

  const handleDelete = (item: MobileTodoItem) =>
    item.notePath && void deleteTodo(item.notePath, item.lineIndex);

  const handleOpenNote = (notePath: string) =>
    router.push({
      pathname: "/editor",
      params: { path: notePath, mode: "edit" },
    });

  const isRem = activeTab === "reminders";

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: tokens.color.bg.primary,
        paddingTop: insets.top,
      }}
    >
      {/* Top Header: Sidebar icon & Tabs Switcher */}
      <View
        className="flex-row items-center px-4 pt-3 pb-2.5"
        style={{ gap: 12 }}
      >
        <Pressable
          onPress={() => setSidebarVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open sidebar"
          className="p-1 -ml-1 active:opacity-60"
        >
          <List size={26} color={tokens.color.text.normal} weight="regular" />
        </Pressable>
        <View
          className="flex-1 flex-row p-1 rounded-xl"
          style={{ backgroundColor: tokens.color.bg.secondary }}
        >
          <Pressable
            onPress={() => setActiveTab("reminders")}
            className="flex-1 py-1.5 rounded-lg items-center justify-center"
            style={{
              backgroundColor: isRem
                ? tokens.color.interactive.accent
                : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: isRem
                  ? tokens.color.text["on-accent"]
                  : tokens.color.text.muted,
              }}
            >
              Reminders & Events
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("todos")}
            className="flex-1 py-1.5 rounded-lg items-center justify-center"
            style={{
              backgroundColor: !isRem
                ? tokens.color.interactive.accent
                : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: !isRem
                  ? tokens.color.text["on-accent"]
                  : tokens.color.text.muted,
              }}
            >
              Todos & Projects
            </Text>
          </Pressable>
        </View>
      </View>

      {isRem ? (
        <RemindersHubView onOpenNote={handleOpenNote} />
      ) : (
        <TodoListView
          listName={listName}
          projectName={projectName}
          formattedDate={formattedDate}
          displayedTodos={displayedTodos}
          isLoading={isLoading}
          refresh={refresh}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onOpenNote={handleOpenNote}
          selectedDate={selectedDate}
          onSelectDate={(iso) =>
            setSelectedDate((prev) => (prev === iso ? null : iso))
          }
          onOpenAddItem={() => setAddItemVisible(true)}
        />
      )}

      {/* Todos Sidebar with Bottom Search */}
      <TodosSidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        projects={projects}
        openedTodoPath={openedTodoPath}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
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

      {/* Modals */}
      <AddTodoItemModal
        visible={addItemVisible}
        todoListName={listName}
        onClose={() => setAddItemVisible(false)}
        onAddItem={(t, d, r) => void addTodoItem(openedTodoPath, t, d, r)}
      />
      <AddProjectModal
        visible={addProjectVisible}
        onClose={() => setAddProjectVisible(false)}
        onCreateProject={(pName) => void createProject(pName)}
      />
      <AddTodoListModal
        visible={addTodoListVisible}
        projectName={projectForNewList}
        onClose={() => setAddTodoListVisible(false)}
        onCreateTodoList={(pName, lName) => void createTodoList(pName, lName)}
      />
    </View>
  );
}
