import React, { useState } from "react";
import { View, Modal, Pressable, TextInput, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Clock, Plus, Tag } from "phosphor-react-native";
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
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const [title, setTitle] = useState("");
  const [project, setProject] = useState("Work");
  const [dateTime, setDateTime] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const availableProjects = Array.from(
    new Set([
      "Work",
      "Events",
      "Daily",
      "Personal",
      ...projects.filter((p) => p !== "All"),
    ]),
  );

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const finalDateTime =
      dateTime.trim() ||
      new Date().toISOString().slice(0, 16).replace("T", " ");
    onAdd(trimmedTitle, finalDateTime, project.trim() || "Events");
    setTitle("");
    setDateTime("");
    onClose();
  };

  return (
    <>
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

            <View className="items-center flex-1 mx-2">
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: tokens.color.text.normal,
                }}
              >
                Add Reminder & Event
              </Text>
            </View>

            <Pressable
              onPress={handleSave}
              disabled={!title.trim()}
              className="px-3 py-1.5 rounded-lg active:opacity-75"
              style={{
                backgroundColor: title.trim()
                  ? tokens.color.interactive.accent
                  : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: title.trim()
                    ? tokens.color.text["on-accent"]
                    : tokens.color.text.muted,
                }}
              >
                Save
              </Text>
            </Pressable>
          </View>

          {/* Form Content */}
          <ScrollView
            className="flex-1 p-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Flight to Berlin, Tax deadline..."
              placeholderTextColor={tokens.color.text.muted}
              className="px-4 py-3 rounded-xl mb-4"
              style={{
                backgroundColor: tokens.color.bg.secondary,
                color: tokens.color.text.normal,
                fontSize: 16,
              }}
              autoFocus
              returnKeyType="done"
            />

            {/* Date & Time Picker */}
            <Pressable
              onPress={() => setPickerOpen(true)}
              className="flex-row items-center justify-between px-4 py-3 rounded-xl mb-4 active:opacity-80"
              style={{ backgroundColor: tokens.color.bg.secondary }}
            >
              <View className="flex-row items-center">
                <Clock
                  size={18}
                  color={
                    dateTime
                      ? tokens.color.interactive.accent
                      : tokens.color.text.muted
                  }
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    color: dateTime
                      ? tokens.color.text.normal
                      : tokens.color.text.muted,
                    fontWeight: dateTime ? "600" : "400",
                  }}
                >
                  {dateTime || "Choose Date & Time (iOS spinner)"}
                </Text>
              </View>
            </Pressable>

            {/* Project Category Selection */}
            <View className="mb-6">
              <View className="flex-row items-center gap-1.5 mb-2">
                <Tag size={16} color={tokens.color.text.muted} />
                <Text
                  style={{
                    fontSize: 13,
                    color: tokens.color.text.muted,
                    fontWeight: "500",
                  }}
                >
                  Project category
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-1"
              >
                {availableProjects.map((p) => {
                  const isSelected = project === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setProject(p)}
                      className="px-3.5 py-1.5 rounded-full mx-1 active:opacity-80"
                      style={{
                        backgroundColor: isSelected
                          ? tokens.color.interactive.accent
                          : tokens.color.bg.secondary,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: isSelected
                            ? tokens.color.text["on-accent"]
                            : tokens.color.text.normal,
                        }}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Action Button */}
            <Pressable
              onPress={handleSave}
              disabled={!title.trim()}
              className="py-3.5 rounded-xl items-center justify-center active:opacity-90 flex-row gap-2"
              style={{
                backgroundColor: title.trim()
                  ? tokens.color.interactive.accent
                  : tokens.color.bg.secondary,
              }}
            >
              <Plus
                size={18}
                color={
                  title.trim()
                    ? tokens.color.text["on-accent"]
                    : tokens.color.text.muted
                }
                weight="bold"
              />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: title.trim()
                    ? tokens.color.text["on-accent"]
                    : tokens.color.text.muted,
                }}
              >
                Save Reminder
              </Text>
            </Pressable>
          </ScrollView>
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
