import React, { useState } from "react";
import { View, Modal, Pressable, ScrollView, Alert } from "react-native";
import { X, FolderSimplePlus, Folder, CheckSquare, CaretDown, CaretRight, Plus, FileText, Bell } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import type { MobileTodoProject, MobileTodoList } from "./types";

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
}: TodosSidebarProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ daily: true });

  const confirmDeleteProject = (projectName: string) => {
    if (projectName.toLowerCase() === "daily") {
      Alert.alert("Daily Project", "The default Daily project cannot be removed.");
      return;
    }
    Alert.alert("Delete Project", `Delete "${projectName}" and all its todo lists?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDeleteProject?.(projectName) },
    ]);
  };

  const confirmDeleteTodoList = (listName: string, notePath: string) => {
    Alert.alert("Delete Todo List", `Delete "${listName}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDeleteTodoList?.(notePath) },
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
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 12,
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pb-3 border-b" style={{ borderBottomColor: tokens.color.border.subtle }}>
          <View className="flex-row items-center gap-2">
            <CheckSquare size={22} color="#000000" weight="bold" />
            <Text style={{ fontSize: 19, fontWeight: "700", color: tokens.color.text.normal }}>Projects & Todos</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Pressable
              onPress={() => { onClose(); onAddProject(); }}
              accessibilityRole="button"
              accessibilityLabel="Add project folder"
              className="p-1.5 active:opacity-60"
            >
              <FolderSimplePlus size={22} color="#000000" />
            </Pressable>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close page" className="p-1.5 active:opacity-60">
              <X size={22} color="#000000" />
            </Pressable>
          </View>
        </View>

          {/* Projects and their Todo Lists */}
          <ScrollView className="flex-1 px-2 pt-2" showsVerticalScrollIndicator={false}>
            {onSelectReminders ? (
              <Pressable
                onPress={() => {
                  onSelectReminders();
                  onClose();
                }}
                className="flex-row items-center gap-2.5 px-3 py-2.5 mb-2 rounded-xl active:bg-black/5"
              >
                <Bell size={19} color="#000000" weight="bold" />
                <Text style={{ fontSize: 16, fontWeight: "700", color: tokens.color.text.normal }}>
                  Reminders & Events
                </Text>
              </Pressable>
            ) : null}

            {projects.map((proj) => {
              const isExp = expanded[proj.id] ?? true;
              return (
                <View key={proj.id} className="mb-2">
                  {/* Project Header Row (Transparent, hold to delete) */}
                  <View className="flex-row items-center justify-between px-3 py-2.5 rounded-lg" style={{ backgroundColor: "transparent" }}>
                    <Pressable
                      className="flex-1 flex-row items-center gap-2.5 active:opacity-60"
                      onPress={() => setExpanded((prev) => ({ ...prev, [proj.id]: !isExp }))}
                      onLongPress={() => confirmDeleteProject(proj.name)}
                    >
                      <Folder size={19} color="#000000" weight="fill" />
                      <Text style={{ fontSize: 16, fontWeight: "700", color: tokens.color.text.normal }}>
                        {proj.name}
                      </Text>
                      <Text style={{ fontSize: 13, color: tokens.color.text.muted }}>
                        ({proj.todoLists.length})
                      </Text>
                    </Pressable>

                    <View className="flex-row items-center gap-1.5">
                      <Pressable
                        onPress={() => { onClose(); onAddTodoList(proj.name); }}
                        accessibilityRole="button"
                        accessibilityLabel={`New todo list in ${proj.name}`}
                        className="p-1.5 active:opacity-60"
                      >
                        <Plus size={18} color="#000000" />
                      </Pressable>
                      <Pressable
                        onPress={() => setExpanded((prev) => ({ ...prev, [proj.id]: !isExp }))}
                        className="p-1.5 active:opacity-60"
                      >
                        {isExp ? <CaretDown size={16} color={tokens.color.text.muted} /> : <CaretRight size={16} color={tokens.color.text.muted} />}
                      </Pressable>
                    </View>
                  </View>

                  {/* Todo Lists under this Project */}
                  {isExp && proj.todoLists.length > 0 ? (
                    <View className="pl-4 pr-1 pt-1">
                      {proj.todoLists.map((list: MobileTodoList) => {
                        const isOpened = openedTodoPath === list.notePath;
                        return (
                          <Pressable
                            key={list.id}
                            onPress={() => {
                              onSelectTodoList(list.notePath);
                              onClose();
                            }}
                            onLongPress={() => confirmDeleteTodoList(list.name, list.notePath)}
                            className="py-2.5 px-3 flex-row items-center justify-between rounded-lg mb-1 active:opacity-60"
                            style={{ backgroundColor: isOpened ? tokens.color.bg.secondary : "transparent" }}
                          >
                            <View className="flex-row items-center gap-2.5 flex-1">
                              <FileText size={18} color="#000000" />
                              <Text
                                numberOfLines={1}
                                style={{
                                  fontSize: 15,
                                  fontWeight: isOpened ? "700" : "500",
                                  color: isOpened ? tokens.color.text.normal : tokens.color.text.muted,
                                  flex: 1,
                                }}
                              >
                                {list.name}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 13, color: tokens.color.text.muted }}>
                              {list.todoCount}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
      </View>
    </Modal>
  );
}
