import React, { useState, useEffect } from "react";
import { View, Modal, Pressable, TextInput, ScrollView } from "react-native";
import { X, Clock, FolderSimple } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";

export interface AddTodoModalProps {
  visible: boolean;
  onClose: () => void;
  onAddTodo: (text: string, duration: string, reminder?: string, project?: string) => void;
  projects?: Array<{ id: string; name: string }>;
  defaultProject?: string;
}

export function AddTodoModal({
  visible,
  onClose,
  onAddTodo,
  projects = [],
  defaultProject = "Daily routine",
}: AddTodoModalProps): React.ReactElement {
  const { tokens } = useTheme();
  const [text, setText] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("5 min");
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [selectedProject, setSelectedProject] = useState(defaultProject);

  useEffect(() => {
    if (defaultProject && defaultProject !== "all") {
      setSelectedProject(defaultProject);
    }
  }, [defaultProject]);

  const durations = ["5 min", "10 min", "15 min", "30 min"];
  const availableProjects = projects.filter((p) => p.id !== "all");

  const handleAdd = () => {
    if (!text.trim()) return;
    const reminderStr = hasReminder ? `${new Date().toISOString().slice(0, 10)} ${reminderTime}` : undefined;
    onAddTodo(text.trim(), selectedDuration, reminderStr, selectedProject);
    setText("");
    setHasReminder(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
        <View className="p-6 rounded-t-3xl" style={{ backgroundColor: "#ffffff" }}>
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text style={{ fontSize: 18, fontWeight: "700", color: tokens.color.text.normal }}>
              Add Task to Project
            </Text>
            <Pressable onPress={onClose} className="p-1">
              <X size={20} color={tokens.color.text.muted} />
            </Pressable>
          </View>

          {/* Project selector */}
          {availableProjects.length > 0 ? (
            <View className="mb-4">
              <Text style={{ fontSize: 13, fontWeight: "600", color: tokens.color.text.muted, marginBottom: 8 }}>
                Select Project
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {availableProjects.map((proj) => {
                  const isCur = selectedProject.toLowerCase() === proj.name.toLowerCase();
                  return (
                    <Pressable
                      key={proj.id}
                      onPress={() => setSelectedProject(proj.name)}
                      className="mr-2 px-3 py-1.5 rounded-full border flex-row items-center gap-1.5"
                      style={{
                        backgroundColor: isCur ? "#4a2810" : "#ffffff",
                        borderColor: isCur ? "#4a2810" : tokens.color.border.subtle,
                      }}
                    >
                      <FolderSimple size={13} color={isCur ? "#ffffff" : tokens.color.text.muted} />
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: isCur ? "700" : "500",
                          color: isCur ? "#ffffff" : tokens.color.text.normal,
                        }}
                      >
                        {proj.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {/* Task Title Input */}
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="e.g. Drink a glass of water, Meditate..."
            placeholderTextColor={tokens.color.text.muted}
            className="px-4 py-3 rounded-xl border mb-4"
            style={{
              backgroundColor: tokens.color.bg.primary,
              borderColor: tokens.color.border.subtle,
              color: tokens.color.text.normal,
              fontSize: 15,
            }}
            autoFocus
          />

          {/* Duration chips */}
          <Text style={{ fontSize: 13, fontWeight: "600", color: tokens.color.text.muted, marginBottom: 8 }}>
            Duration
          </Text>
          <View className="flex-row items-center gap-2 mb-4">
            {durations.map((dur) => {
              const isSelected = selectedDuration === dur;
              return (
                <Pressable
                  key={dur}
                  onPress={() => setSelectedDuration(dur)}
                  className="px-3.5 py-1.5 rounded-full border"
                  style={{
                    backgroundColor: isSelected ? "#4a2810" : "#ffffff",
                    borderColor: isSelected ? "#4a2810" : tokens.color.border.subtle,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? "#ffffff" : tokens.color.text.normal,
                    }}
                  >
                    {dur}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Reminder Toggle */}
          <Pressable
            onPress={() => setHasReminder(!hasReminder)}
            className="flex-row items-center justify-between p-3 rounded-xl border mb-6"
            style={{
              backgroundColor: hasReminder ? "#fce9d8" : "#ffffff",
              borderColor: hasReminder ? "#f5d3b6" : tokens.color.border.subtle,
            }}
          >
            <View className="flex-row items-center gap-2">
              <Clock size={18} color={hasReminder ? "#b85c14" : tokens.color.text.muted} />
              <Text style={{ fontSize: 14, fontWeight: "500", color: tokens.color.text.normal }}>
                {hasReminder ? `Reminder set for ${reminderTime}` : "Set reminder"}
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#b85c14" }}>
              {hasReminder ? "Enabled" : "Add"}
            </Text>
          </Pressable>

          {/* Action Button */}
          <Pressable
            onPress={handleAdd}
            disabled={!text.trim()}
            className="py-3.5 rounded-2xl items-center justify-center active:opacity-90"
            style={{
              backgroundColor: text.trim() ? "#4a2810" : tokens.color.bg.hover,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: text.trim() ? "#ffffff" : tokens.color.text.muted }}>
              Add Task
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
