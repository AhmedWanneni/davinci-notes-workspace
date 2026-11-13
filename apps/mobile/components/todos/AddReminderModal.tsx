import React, { useState } from "react";
import { View, Modal, Pressable, TextInput, ScrollView } from "react-native";
import { X, Clock, Plus, Tag } from "phosphor-react-native";
import { useTheme } from "../../theme";
import { Text } from "../primitives";
import { DateTimePickerModal } from "./DateTimePickerModal";

export interface AddReminderModalProps {
  visible: boolean;
  projects: string[];
  onClose: () => void;
  onAdd: (title: string, dateTime: string, project: string) => void;
}

export function AddReminderModal({
  visible,
  projects,
  onClose,
  onAdd,
}: AddReminderModalProps): React.ReactElement {
  const { tokens } = useTheme();
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("Work");
  const [dateTime, setDateTime] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const availableProjects = Array.from(new Set(["Work", "Events", "Daily", "Personal", ...projects.filter((p) => p !== "All")]));

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const finalDateTime = dateTime.trim() || new Date().toISOString().slice(0, 16).replace("T", " ");
    onAdd(trimmedTitle, finalDateTime, project.trim() || "Events");
    setTitle("");
    setDateTime("");
    onClose();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View className="p-6 rounded-t-3xl" style={{ backgroundColor: "#ffffff" }}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text style={{ fontSize: 18, fontWeight: "700", color: tokens.color.text.normal }}>
                  Add Reminder & Event
                </Text>
                <Text style={{ fontSize: 12, color: tokens.color.text.muted }}>
                  Set date, time, and project category
                </Text>
              </View>
              <Pressable onPress={onClose} className="p-1 active:opacity-60">
                <X size={20} color={tokens.color.text.muted} />
              </Pressable>
            </View>

            {/* Title input */}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Design review, Team sync, Client call..."
              placeholderTextColor={tokens.color.text.muted}
              className="px-4 py-3 rounded-xl border mb-3"
              style={{
                backgroundColor: tokens.color.bg.primary,
                borderColor: tokens.color.border.subtle,
                color: tokens.color.text.normal,
                fontSize: 15,
              }}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            {/* Project / Event Category Selector */}
            <View className="mb-3">
              <View className="flex-row items-center gap-1.5 mb-2">
                <Tag size={14} color={tokens.color.text.muted} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: tokens.color.text.muted }}>
                  Project / Event Category
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
                {availableProjects.map((p) => {
                  const isSelected = project === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setProject(p)}
                      className="mx-1 px-3.5 py-1.5 rounded-full border active:opacity-75"
                      style={{
                        backgroundColor: isSelected ? "#000000" : "#ffffff",
                        borderColor: isSelected ? "#000000" : tokens.color.border.subtle,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: isSelected ? "#ffffff" : tokens.color.text.normal,
                        }}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Date & Time trigger using Expo DateTimePicker */}
            <Pressable
              onPress={() => setPickerOpen(true)}
              className="flex-row items-center justify-between px-4 py-3 rounded-xl border mb-5 active:opacity-80"
              style={{
                backgroundColor: tokens.color.bg.primary,
                borderColor: dateTime ? "#000000" : tokens.color.border.subtle,
              }}
            >
              <View className="flex-row items-center flex-1">
                <Clock size={18} color={dateTime ? "#000000" : tokens.color.text.muted} />
                <Text
                  style={{
                    marginLeft: 10,
                    fontSize: 14,
                    color: dateTime ? "#111827" : tokens.color.text.muted,
                    fontWeight: dateTime ? "600" : "400",
                  }}
                >
                  {dateTime ? `Scheduled: ${dateTime}` : "Select Date & Time (Expo Picker)"}
                </Text>
              </View>
              {dateTime ? (
                <Pressable
                  hitSlop={8}
                  onPress={(e) => {
                    e.stopPropagation();
                    setDateTime("");
                  }}
                  className="p-1"
                >
                  <X size={15} color={tokens.color.text.muted} />
                </Pressable>
              ) : null}
            </Pressable>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={!title.trim()}
              className="py-3.5 rounded-2xl items-center justify-center active:opacity-90 flex-row gap-2"
              style={{
                backgroundColor: title.trim() ? "#000000" : tokens.color.bg.hover,
              }}
            >
              <Plus size={18} color={title.trim() ? "#ffffff" : tokens.color.text.muted} weight="bold" />
              <Text style={{ fontSize: 15, fontWeight: "700", color: title.trim() ? "#ffffff" : tokens.color.text.muted }}>
                Save Reminder & Event
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={(val) => setDateTime(val)}
      />
    </>
  );
}
