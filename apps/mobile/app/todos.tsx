import React, { useState, useMemo, useEffect } from "react";
import { View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { EditorBottomBar } from "../components/EditorBottomBar";
import {
  TodoListView,
  TodosSidebar,
  TodosHeaderTabs,
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
  const params = useLocalSearchParams<{ tab?: string }>();
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
  const [activeTab, setActiveTab] = useState<"reminders" | "todos">(() =>
    params.tab === "reminders" ? "reminders" : "todos",
  );
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [addItemVisible, setAddItemVisible] = useState(false);
  const [addProjectVisible, setAddProjectVisible] = useState(false);
  const [addTodoListVisible, setAddTodoListVisible] = useState(false);
  const [projectForNewList, setProjectForNewList] = useState("Daily");

  useEffect(() => {
    if (params.tab === "reminders") setActiveTab("reminders");
    else if (params.tab === "todos") setActiveTab("todos");
  }, [params.tab]);

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

  const taskDates = useMemo(() => {
    const dates = new Set<string>();
    for (const item of todos) {
      if (item.dueDate) dates.add(item.dueDate);
      if (item.reminder) {
        const m = item.reminder.match(/^(\d{4}-\d{2}-\d{2})/);
        if (m) dates.add(m[1]);
      }
    }
    return dates;
  }, [todos]);

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
      <TodosHeaderTabs
        title={isRem ? "Reminders & Events" : "Todos"}
        onOpenSidebar={() => setSidebarVisible(true)}
        isCalendarVisible={isCalendarVisible}
        onToggleCalendar={() => setIsCalendarVisible((v) => !v)}
      />

      <View className="flex-1">
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
            taskDates={taskDates}
            isCalendarVisible={isCalendarVisible}
          />
        )}
      </View>

      <EditorBottomBar
        activeScreen={isRem ? "notifications" : "todo"}
        onTodo={() => setActiveTab("todos")}
        onNewNote={() =>
          router.push({
            pathname: "/editor",
            params: { preset: "new", autoFocus: "1" },
          })
        }
        onSearch={() => router.push("/search")}
        onNotifications={() => setActiveTab("reminders")}
        onTabs={() => router.push("/editor")}
        onMenu={() => router.push("/settings")}
        tabCount={1}
      />

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
        onAddProject={() => setAddProjectVisible(true)}
        onAddTodoList={(pName) => {
          setProjectForNewList(pName);
          setAddTodoListVisible(true);
        }}
        onDeleteProject={(pName) => void deleteProject(pName)}
        onDeleteTodoList={(path) => void deleteTodoList(path)}
      />

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
