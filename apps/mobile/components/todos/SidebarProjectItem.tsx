import React from "react";
import { View, Pressable } from "react-native";
import { Folder, Plus, FileText } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import type { MobileTodoProject, MobileTodoList } from "./types";

export interface SidebarProjectItemProps {
  proj: MobileTodoProject;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDeleteProject: (name: string) => void;
  onAddTodoList: (projectName: string) => void;
  openedTodoPath: string;
  onSelectTodoList: (notePath: string) => void;
  onDeleteTodoList: (name: string, notePath: string) => void;
}

export function SidebarProjectItem({
  proj,
  isExpanded,
  onToggleExpand,
  onDeleteProject,
  onAddTodoList,
  openedTodoPath,
  onSelectTodoList,
  onDeleteTodoList,
}: SidebarProjectItemProps): React.ReactElement {
  const { tokens } = useTheme();

  return (
    <View className="mb-2">
      {/* Project Header Row */}
      <View
        className="flex-row items-center justify-between px-3 py-2.5 rounded-lg"
        style={{ backgroundColor: "transparent" }}
      >
        <Pressable
          className="flex-1 flex-row items-center gap-2.5 active:opacity-60"
          onPress={onToggleExpand}
          onLongPress={() => onDeleteProject(proj.name)}
        >
          <Folder size={19} color={tokens.color.text.normal} weight="fill" />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: tokens.color.text.normal,
            }}
          >
            {proj.name}
          </Text>
          <Text style={{ fontSize: 13, color: tokens.color.text.muted }}>
            ({proj.todoLists.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onAddTodoList(proj.name)}
          accessibilityRole="button"
          accessibilityLabel={`New todo list in ${proj.name}`}
          className="p-1.5 active:opacity-60"
        >
          <Plus size={18} color={tokens.color.text.normal} />
        </Pressable>
      </View>

      {/* Todo Lists under this Project */}
      {isExpanded && proj.todoLists.length > 0 ? (
        <View className="pl-4 pr-1 pt-1">
          {proj.todoLists.map((list: MobileTodoList) => {
            const isOpened = openedTodoPath === list.notePath;
            return (
              <Pressable
                key={list.id}
                onPress={() => onSelectTodoList(list.notePath)}
                onLongPress={() => onDeleteTodoList(list.name, list.notePath)}
                className="py-2.5 px-3 flex-row items-center justify-between rounded-lg mb-1 active:opacity-60"
                style={{
                  backgroundColor: isOpened
                    ? tokens.color.bg.secondary
                    : "transparent",
                }}
              >
                <View className="flex-row items-center gap-2.5 flex-1">
                  <FileText size={18} color={tokens.color.text.normal} />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 15,
                      fontWeight: isOpened ? "700" : "500",
                      color: isOpened
                        ? tokens.color.text.normal
                        : tokens.color.text.muted,
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
}
