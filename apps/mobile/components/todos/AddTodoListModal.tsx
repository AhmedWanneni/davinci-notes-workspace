import React, { useState } from "react";
import { View, Modal, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, FileText } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface AddTodoListModalProps {
  visible: boolean;
  projectName: string;
  onClose: () => void;
  onCreateTodoList: (projectName: string, listName: string) => void;
}

export function AddTodoListModal({
  visible,
  projectName,
  onClose,
  onCreateTodoList,
}: AddTodoListModalProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const [listName, setListName] = useState("");

  const handleCreate = () => {
    const trimmed = listName.trim();
    if (!trimmed) return;
    onCreateTodoList(projectName, trimmed);
    setListName("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        className="flex-1"
        style={{
          backgroundColor: tokens.color.bg.primary,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* Fullscreen Header */}
        <View
          className="flex-row items-center justify-between px-4 py-3 border-b"
          style={{ borderBottomColor: tokens.color.border.subtle }}
        >
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="w-9 h-9 items-center justify-center -ml-1 rounded-lg active:opacity-60"
          >
            <ArrowLeft size={22} color={tokens.color.text.normal} />
          </Pressable>

          <View className="flex-row items-center gap-2">
            <FileText size={20} color={tokens.color.text.normal} />
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: tokens.color.text.normal,
              }}
            >
              New List in {projectName}
            </Text>
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={!listName.trim()}
            className="px-3 py-1.5 rounded-lg active:opacity-75"
            style={{
              backgroundColor: listName.trim()
                ? tokens.color.interactive.accent
                : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: listName.trim()
                  ? tokens.color.text["on-accent"]
                  : tokens.color.text.muted,
              }}
            >
              Save
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <View className="p-4">
          <Text
            style={{
              fontSize: 13,
              color: tokens.color.text.muted,
              marginBottom: 16,
            }}
          >
            Creates a new markdown checklist document inside {projectName}/.
          </Text>

          <TextInput
            value={listName}
            onChangeText={setListName}
            placeholder="e.g. Sprint, Groceries, Ideas..."
            placeholderTextColor={tokens.color.text.muted}
            className="px-4 py-3 rounded-xl mb-4"
            style={{
              backgroundColor: tokens.color.bg.secondary,
              color: tokens.color.text.normal,
              fontSize: 16,
            }}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
        </View>
      </View>
    </Modal>
  );
}
