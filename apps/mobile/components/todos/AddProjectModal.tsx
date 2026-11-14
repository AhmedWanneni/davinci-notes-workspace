import React, { useState } from "react";
import { View, Modal, Pressable, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, FolderSimplePlus } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface AddProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateProject: (projectName: string) => void;
}

export function AddProjectModal({
  visible,
  onClose,
  onCreateProject,
}: AddProjectModalProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const [projectName, setProjectName] = useState("");

  const handleCreate = () => {
    const trimmed = projectName.trim();
    if (!trimmed) return;
    onCreateProject(trimmed);
    setProjectName("");
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
            <FolderSimplePlus size={20} color={tokens.color.text.normal} />
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: tokens.color.text.normal,
              }}
            >
              New Project
            </Text>
          </View>

          <Pressable
            onPress={handleCreate}
            disabled={!projectName.trim()}
            className="px-3 py-1.5 rounded-lg active:opacity-75"
            style={{
              backgroundColor: projectName.trim()
                ? tokens.color.interactive.accent
                : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: projectName.trim()
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
            Creates a dedicated folder under Todos/ to organize your checklist
            tasks and reminders.
          </Text>

          <TextInput
            value={projectName}
            onChangeText={setProjectName}
            placeholder="e.g. Work, Health, Personal..."
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
