import React, { useState } from "react";
import { View, Modal, Pressable, TextInput } from "react-native";
import { X, FileText } from "phosphor-react-native";
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View
          className="w-full max-w-sm rounded-2xl p-5"
          style={{
            backgroundColor: tokens.color.bg.primary,
            borderWidth: 1,
            borderColor: tokens.color.border.subtle,
            elevation: 8,
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <FileText size={20} color="#000000" weight="regular" />
              <Text style={{ fontSize: 16, fontWeight: "700", color: tokens.color.text.normal }}>
                New Todo List in {projectName}
              </Text>
            </View>
            <Pressable onPress={onClose} className="p-1 -mr-1 active:opacity-60">
              <X size={18} color={tokens.color.text.muted} />
            </Pressable>
          </View>

          <Text style={{ fontSize: 13, color: tokens.color.text.muted, marginBottom: 14 }}>
            Creates a new markdown checklist document inside {projectName}/.
          </Text>

          <TextInput
            value={listName}
            onChangeText={setListName}
            placeholder="e.g. Sprint, Groceries, Ideas..."
            placeholderTextColor={tokens.color.text.muted}
            className="px-3.5 py-2.5 rounded-xl border mb-4"
            style={{
              backgroundColor: tokens.color.bg.secondary,
              borderColor: tokens.color.border.subtle,
              color: tokens.color.text.normal,
              fontSize: 14,
            }}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />

          <View className="flex-row items-center justify-end gap-2">
            <Pressable onPress={onClose} className="px-4 py-2 rounded-xl active:opacity-60">
              <Text style={{ fontSize: 13, fontWeight: "500", color: tokens.color.text.muted }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleCreate}
              disabled={!listName.trim()}
              className="px-4 py-2 rounded-xl active:opacity-80"
              style={{ backgroundColor: listName.trim() ? tokens.color.interactive.accent : tokens.color.bg.hover }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: listName.trim() ? tokens.color.text["on-accent"] : tokens.color.text.muted }}>
                Create
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
